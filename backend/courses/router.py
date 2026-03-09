#
#
# from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
# from datetime import datetime
# from firebase_admin import firestore
#
# # Imports from Core
# from core.database import db
# from core.security import get_current_user
# from courses.services import upload_blob, generate_read_sas
#
# # Import the AI Pipeline function
# from ai_features.services import run_ai_pipeline
#
# router = APIRouter()
#
# @router.post("/upload")
# async def upload_video(
#     background_tasks: BackgroundTasks,  # <--- INJECT BACKGROUND TASKS
#     file: UploadFile = File(...),
#     title: str = Form(...),
#     user: dict = Depends(get_current_user)
# ):
#     try:
#         instructor_id = user['uid']
#         clean_filename = file.filename.replace(" ", "_")
#         timestamp = int(datetime.now().timestamp())
#
#         # Path structure: instructors/{uid}/videos/...
#         blob_path = f"instructors/{instructor_id}/videos/{timestamp}_{clean_filename}"
#
#         # 1. Upload to Azure
#         file_content = await file.read()
#         upload_blob(file_content, blob_path)
#
#         # 2. Generate Link (Needed for Frontend AND for AI to download it)
#         sas_url = generate_read_sas(blob_path)
#
#         # 3. Save to Firebase (Old Schema)
#         doc_ref = db.collection("videos").document()
#         doc_ref.set({
#             "title": title,
#             "instructor_id": instructor_id,
#             "video_url": sas_url,
#             "storage_path": blob_path,
#             "filename": clean_filename,
#             "status": "processing", # <--- Set status to processing immediately
#             "created_at": firestore.SERVER_TIMESTAMP,
#             "summary": "AI is analyzing this video...", # Placeholder
#             "transcript": ""
#         })
#
#         # 4. TRIGGER AI AUTOMATICALLY 🚀
#         # We pass the doc_id, the SAS URL, and the filename to the AI worker
#         background_tasks.add_task(run_ai_pipeline, doc_ref.id, sas_url, clean_filename)
#
#         return {
#             "message": "Upload successful. AI processing started automatically.",
#             "video_id": doc_ref.id
#         }
#
#     except Exception as e:
#         print(f"❌ Upload Error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))
#
# @router.get("/")
# def get_videos(user: dict = Depends(get_current_user)):
#     """
#     Fetches videos using the Old Schema logic
#     """
#     docs = db.collection("videos").order_by("created_at", direction=firestore.Query.DESCENDING).stream()
#     videos = []
#     for doc in docs:
#         data = doc.to_dict()
#         if "created_at" in data and data["created_at"] is not None:
#             data["created_at"] = data["created_at"].isoformat()
#         data["id"] = doc.id
#         videos.append(data)
#     return videos


from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, BackgroundTasks
from datetime import datetime
from firebase_admin import firestore, auth as firebase_auth
import uuid
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud.firestore_v1 import ArrayUnion
from pydantic import BaseModel

# Imports from Core
from core.database import db
from core.security import get_current_user
from courses.services import upload_blob, generate_read_sas
from core.email_service import send_enrollment_email, send_completion_email, send_trainer_update_email

# Import the AI Pipeline function
from ai_features.services import run_ai_pipeline

router = APIRouter()


def _resolve_user_name(uid: str, firestore_data: dict = None, token_data: dict = None) -> str:
    """Resolves the full display name for a user, checking multiple sources."""
    # 1. Check Firestore data if provided
    if firestore_data:
        name = firestore_data.get("displayName") or firestore_data.get("name")
        if name:
            return name

    # 2. Check token data if provided
    if token_data:
        name = token_data.get("name")
        if name:
            return name

    # 3. Look up Firebase Auth directly (has Google profile name)
    try:
        fb_user = firebase_auth.get_user(uid)
        if fb_user.display_name:
            # Backfill to Firestore so future lookups are faster
            db.collection("users").document(uid).set(
                {"displayName": fb_user.display_name}, merge=True
            )
            return fb_user.display_name
    except Exception:
        pass

    # 4. Fallback to email prefix
    email = (firestore_data or {}).get("email") or (token_data or {}).get("email") or ""
    return email.split("@")[0] if email else "User"


class TrainerUpdateRequest(BaseModel):
    subject: str
    message: str


@router.post("/")
async def create_course(
        title: str = Form(...),
        category: str = Form("GenAi"),  # 🆕 Added Category
        description: str = Form(""),
        user: dict = Depends(get_current_user)
):
    """Creates a new top-level course."""
    try:
        instructor_id = user['uid']
        doc_ref = db.collection("courses").document()

        course_data = {
            "id": doc_ref.id,
            "title": title,
            "description": description,
            "category": category,  # 🆕 Save to Firestore
            "instructor_id": instructor_id,
            "is_published": False,
            "created_at": firestore.SERVER_TIMESTAMP
        }

        doc_ref.set(course_data)

        return {"message": "Course created successfully", "course_id": doc_ref.id}
    except Exception as e:
        print(f"❌ Error creating course: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-courses")
async def get_my_courses(user: dict = Depends(get_current_user)):
    """Fetches courses created by this specific instructor."""
    try:
        instructor_id = user['uid']

        # FIXED: Using FieldFilter to remove the UserWarning
        docs = db.collection("courses") \
            .where(filter=FieldFilter("instructor_id", "==", instructor_id)) \
            .order_by("created_at", direction=firestore.Query.DESCENDING) \
            .stream()

        courses = []
        for doc in docs:
            data = doc.to_dict()
            if "created_at" in data and data["created_at"] is not None:
                data["created_at"] = data["created_at"].isoformat()
            courses.append(data)

        return courses
    except Exception as e:
        print(f"❌ Error fetching courses: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{course_id}/modules")
async def upload_module(
        course_id: str,
        background_tasks: BackgroundTasks,
        title: str = Form(...),
        file: UploadFile = File(...),
        user: dict = Depends(get_current_user)
):
    """Uploads a video as a module inside a course and triggers AI."""
    try:
        clean_filename = file.filename.replace(" ", "_")
        module_id = f"mod_{uuid.uuid4().hex[:8]}"

        print(f"📦 Uploading Module: {module_id} for Course: {course_id}")

        # 1. Structure Blob Path: videos/{course_id}/{module_id}_{filename}
        blob_path = f"videos/{course_id}/{module_id}_{clean_filename}"

        # 2. Upload to Azure (using your existing services.py logic)
        file_content = await file.read()
        upload_blob(file_content, blob_path)

        # 3. Generate SAS (Needed for Frontend AND for AI to download it)
        sas_url = generate_read_sas(blob_path)
        if not sas_url:
            raise HTTPException(status_code=500, detail="Failed to generate SAS token")

        # 4. Save Module to Firestore Subcollection
        # Path: courses/{course_id}/modules/{module_id}
        module_ref = db.collection("courses").document(course_id).collection("modules").document(module_id)

        # Count existing modules to assign an order_index
        existing_modules = db.collection("courses").document(course_id).collection("modules").get()
        order_index = len(existing_modules)

        module_ref.set({
            "id": module_id,
            "title": title,
            "video_blob_url": sas_url,
            "order_index": order_index,
            "status": "processing",  # Instructor UI will show this status
            "created_at": firestore.SERVER_TIMESTAMP
        })

        # 5. TRIGGER AI PIPELINE 🚀
        # Notice we pass module_id twice (once for the ai_assets doc ID, once for internal logic)
        background_tasks.add_task(
            run_ai_pipeline,
            sas_url,
            course_id,
            module_id,
            clean_filename
        )

        return {
            "message": "Module uploaded successfully. AI processing started.",
            "module_id": module_id
        }

    except Exception as e:
        print(f"❌ Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

#STUDENT

@router.get("/catalog")
async def get_course_catalog(user: dict = Depends(get_current_user)):
    """Fetches all courses available for students to enroll in."""
    try:
        docs = db.collection("courses").order_by("created_at", direction=firestore.Query.DESCENDING).stream()
        courses = [{"id": doc.id, **doc.to_dict()} for doc in docs]

        # Resolve instructor names
        instructor_cache = {}
        for course in courses:
            iid = course.get("instructor_id")
            if iid and iid not in instructor_cache:
                instructor_cache[iid] = _resolve_user_name(iid)
            course["instructor_name"] = instructor_cache.get(iid, "Unknown")

        # Count enrolled students per course
        all_users = db.collection("users").stream()
        enroll_counts: dict[str, int] = {}
        for u in all_users:
            enrollments = (u.to_dict() or {}).get("enrollments", {})
            for cid in enrollments:
                enroll_counts[cid] = enroll_counts.get(cid, 0) + 1

        # Get module counts per course
        for course in courses:
            course["enrolled_count"] = enroll_counts.get(course["id"], 0)
            modules = db.collection("courses").document(course["id"]).collection("modules").get()
            course["module_count"] = len(modules)

        return courses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{course_id}/enroll")
async def enroll_in_course(course_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Enrolls a student in a course by updating their user document."""
    try:
        user_ref = db.collection("users").document(user['uid'])
        learner_email = user.get("email")
        learner_name = _resolve_user_name(user['uid'], token_data=user)

        # Save enrollment + ensure email/name are persisted for later lookups
        user_ref.set({
            "email": learner_email,
            "displayName": learner_name,
            "enrollments": {
                course_id: {
                    "enrolled_at": firestore.SERVER_TIMESTAMP,
                    "completed_modules":[]
                }
            }
        }, merge=True)

        # Send enrollment confirmation email in background
        course_doc = db.collection("courses").document(course_id).get()
        course_title = course_doc.to_dict().get("title", "Unknown Course") if course_doc.exists else "Unknown Course"
        if learner_email:
            background_tasks.add_task(send_enrollment_email, learner_email, learner_name, course_title)

        return {"message": "Successfully enrolled!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{course_id}/modules")
async def get_course_modules(course_id: str, user: dict = Depends(get_current_user)):
    """Fetches all modules for a specific course, ordered by order_index."""
    try:
        docs = db.collection("courses").document(course_id).collection("modules").order_by("order_index").stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{course_id}/modules/{module_id}/complete")
async def complete_module(course_id: str, module_id: str, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user)):
    """Marks a module as completed in the student's enrollment data (Unlocks the next one)."""
    try:
        user_ref = db.collection("users").document(user['uid'])
        # Atomically add the module_id to the completed_modules array
        user_ref.update({
            f"enrollments.{course_id}.completed_modules": ArrayUnion([module_id])
        })

        # Check if ALL modules in the course are now completed
        all_modules = db.collection("courses").document(course_id).collection("modules").get()
        total_modules = len(all_modules)

        user_doc = user_ref.get()
        user_data = user_doc.to_dict() if user_doc.exists else {}
        completed_modules = user_data.get("enrollments", {}).get(course_id, {}).get("completed_modules", [])

        if total_modules > 0 and len(completed_modules) >= total_modules:
            # All modules completed — send certificate email
            course_doc = db.collection("courses").document(course_id).get()
            course_data = course_doc.to_dict() if course_doc.exists else {}
            course_title = course_data.get("title", "Unknown Course")
            # Get instructor full name for the certificate
            instructor_id = course_data.get("instructor_id")
            instructor_name = _resolve_user_name(instructor_id) if instructor_id else "Instructor"
            # Get learner full name
            learner_email = user.get("email")
            learner_name = _resolve_user_name(user['uid'], firestore_data=user_data, token_data=user)
            if learner_email:
                background_tasks.add_task(send_completion_email, learner_email, learner_name, course_title, instructor_name)

        return {"message": "Module completed successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Quiz Results ─────────────────────────────────────────────

class QuizResultPayload(BaseModel):
    score: int
    total: int
    passed: bool


@router.post("/{course_id}/modules/{module_id}/quiz-result")
async def submit_quiz_result(
    course_id: str,
    module_id: str,
    payload: QuizResultPayload,
    user: dict = Depends(get_current_user),
):
    """Saves a quiz attempt result for a student."""
    try:
        doc_ref = db.collection("quiz_results").document()
        doc_ref.set({
            "student_id": user["uid"],
            "student_email": user.get("email", ""),
            "course_id": course_id,
            "module_id": module_id,
            "score": payload.score,
            "total": payload.total,
            "passed": payload.passed,
            "attempted_at": firestore.SERVER_TIMESTAMP,
        })
        return {"message": "Quiz result saved", "id": doc_ref.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}/quiz-results")
async def get_course_quiz_results(course_id: str, user: dict = Depends(get_current_user)):
    """Fetches all quiz results for a course (trainer view)."""
    try:
        results_ref = (
            db.collection("quiz_results")
            .where(filter=FieldFilter("course_id", "==", course_id))
            .order_by("attempted_at", direction=firestore.Query.DESCENDING)
            .stream()
        )
        results = []
        for doc in results_ref:
            d = doc.to_dict()
            display_name = _resolve_user_name(d.get("student_id", ""))
            attempted_at = d.get("attempted_at")
            results.append({
                "id": doc.id,
                "student_id": d.get("student_id", ""),
                "student_name": display_name,
                "student_email": d.get("student_email", ""),
                "module_id": d.get("module_id", ""),
                "score": d.get("score", 0),
                "total": d.get("total", 0),
                "passed": d.get("passed", False),
                "attempted_at": attempted_at.isoformat() if hasattr(attempted_at, "isoformat") else str(attempted_at) if attempted_at else None,
            })
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-profile")
async def get_student_profile(user: dict = Depends(get_current_user)):
    """Fetches the student's profile, including their enrollments."""
    try:
        doc = db.collection("users").document(user['uid']).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User profile not found")
        return doc.to_dict()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{course_id}")
async def delete_course(course_id: str, user: dict = Depends(get_current_user)):
    """Deletes a course."""
    try:
        # Note: In a production app, you'd also delete subcollections and blobs.
        db.collection("courses").document(course_id).delete()
        return {"message": "Course deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{course_id}/modules/{module_id}")
async def delete_module(course_id: str, module_id: str, user: dict = Depends(get_current_user)):
    """Deletes a specific module."""
    try:
        db.collection("courses").document(course_id).collection("modules").document(module_id).delete()
        return {"message": "Module deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{course_id}/notify-learners")
async def notify_learners(
    course_id: str,
    body: TrainerUpdateRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_user)
):
    """Allows a trainer to email all enrolled learners of a course they own."""
    try:
        # Verify the trainer owns this course
        course_doc = db.collection("courses").document(course_id).get()
        if not course_doc.exists:
            raise HTTPException(status_code=404, detail="Course not found")

        course_data = course_doc.to_dict()
        if course_data.get("instructor_id") != user["uid"]:
            raise HTTPException(status_code=403, detail="You can only send updates for your own courses")

        course_title = course_data.get("title", "Unknown Course")

        # Get instructor name
        instructor_name = _resolve_user_name(user["uid"], token_data=user)

        # Fetch all users who are enrolled in this course
        all_users = db.collection("users").stream()
        recipients = []
        for u_doc in all_users:
            u_data = u_doc.to_dict()
            enrollments = u_data.get("enrollments", {})
            if course_id in enrollments:
                email = u_data.get("email")
                if email:
                    name = _resolve_user_name(u_doc.id, firestore_data=u_data)
                    recipients.append((email, name))

        # Send emails in background
        for email, name in recipients:
            background_tasks.add_task(
                send_trainer_update_email, email, name, course_title, instructor_name, body.subject, body.message
            )

        return {"message": f"Update will be sent to {len(recipients)} enrolled learner(s)."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{course_id}/modules/{module_id}")
async def edit_module(
        course_id: str,
        module_id: str,
        background_tasks: BackgroundTasks,
        title: str = Form(None),
        file: UploadFile = File(None),
        user: dict = Depends(get_current_user)
):
    """Updates a module's title and/or replaces the video (re-triggers AI)."""
    try:
        update_data = {}
        if title:
            update_data["title"] = title

        # If a new file is uploaded, replace it in Blob Storage and re-run AI
        if file:
            clean_filename = file.filename.replace(" ", "_")
            blob_path = f"videos/{course_id}/{module_id}_{clean_filename}"

            file_content = await file.read()
            upload_blob(file_content, blob_path)
            sas_url = generate_read_sas(blob_path)

            if sas_url:
                update_data["video_blob_url"] = sas_url
                update_data["status"] = "processing"  # Reset status for UI

                # Re-trigger AI pipeline
                background_tasks.add_task(run_ai_pipeline, sas_url, course_id, module_id, clean_filename)

        # Update Firestore Document
        if update_data:
            db.collection("courses").document(course_id).collection("modules").document(module_id).update(update_data)

        return {"message": "Module updated successfully!"}
    except Exception as e:
        print(f"❌ Error updating module: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}/analytics")
async def get_course_analytics(course_id: str, user: dict = Depends(get_current_user)):
    """Fetches analytics (enrolled students and progress) for a specific course."""
    try:
        # 1. Get total modules for this course
        modules_ref = db.collection("courses").document(course_id).collection("modules").get()
        total_modules = len(modules_ref)

        # 2. Fetch all users (not filtered by role, since some may not have role set)
        users_ref = db.collection("users").stream()

        analytics = []
        for u in users_ref:
            user_data = u.to_dict()
            enrollments = user_data.get("enrollments", {})

            # 3. Check if this student is enrolled in THIS course
            if course_id in enrollments:
                course_data = enrollments[course_id]
                completed_modules = len(course_data.get("completed_modules", []))
                if total_modules > 0:
                    progress = min(int((completed_modules / total_modules) * 100), 100)
                else:
                    # No modules in the course — treat enrolled students as 100 % done
                    progress = 100
                enrolled_at = course_data.get("enrolled_at")

                # Resolve display name
                display_name = _resolve_user_name(u.id, firestore_data=user_data)

                analytics.append({
                    "student_id": u.id,
                    "name": display_name,
                    "email": user_data.get("email", ""),
                    "completed_modules": completed_modules,
                    "progress": progress,
                    "enrolled_at": enrolled_at.isoformat() if hasattr(enrolled_at, 'isoformat') else str(enrolled_at) if enrolled_at else None,
                })

        return {"total_modules": total_modules, "students": analytics}
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))