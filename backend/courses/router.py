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


class CommunityPostRequest(BaseModel):
    course_id: str
    subject: str
    message: str


class CommentRequest(BaseModel):
    content: str


class ReactionRequest(BaseModel):
    emoji: str


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
    finally:
        try:
            course_doc2 = db.collection("courses").document(course_id).get()
            ct = course_doc2.to_dict().get("title", "Unknown Course") if course_doc2.exists else "Unknown Course"
            _log_activity(user["uid"], user.get("email", ""), "enrollment", course_id=course_id, detail=f"Enrolled in {ct}")
        except Exception:
            pass

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
    finally:
        try:
            course_doc2 = db.collection("courses").document(course_id).get()
            ct = course_doc2.to_dict().get("title", "Unknown") if course_doc2.exists else "Unknown"
            _log_activity(user["uid"], user.get("email", ""), "module_complete", course_id=course_id, module_id=module_id, detail=f"Completed module in {ct}")
        except Exception:
            pass


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
    """Saves a quiz attempt result for a student in Firestore."""
    try:
        doc_id = f"{user['uid']}_{course_id}_{module_id}_{int(datetime.utcnow().timestamp())}"
        new_result = {
            "id": doc_id,
            "student_id": user["uid"],
            "student_name": user.get("name", ""),
            "student_email": user.get("email", ""),
            "course_id": course_id,
            "module_id": module_id,
            "score": payload.score,
            "total": payload.total,
            "passed": payload.passed,
            "attempted_at": datetime.utcnow().isoformat() + "Z",
        }
        db.collection("quiz_results").document(doc_id).set(new_result)

        # Log activity
        course_doc = db.collection("courses").document(course_id).get()
        ct = course_doc.to_dict().get("title", "Unknown") if course_doc.exists else "Unknown"
        status_text = "Passed" if payload.passed else "Failed"
        _log_activity(user["uid"], user.get("email", ""), "quiz_attempt", course_id=course_id, module_id=module_id, detail=f"Quiz {status_text} — {payload.score}/{payload.total} in {ct}")

        return {"message": "Quiz result saved", "id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save quiz result: {e}")


@router.get("/{course_id}/quiz-results")
async def get_course_quiz_results(course_id: str, user: dict = Depends(get_current_user)):
    """Fetches all quiz results for a course (trainer view) from Firestore."""
    try:
        docs = db.collection("quiz_results").where(
            filter=FieldFilter("course_id", "==", course_id)
        ).stream()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if d is None:
                continue
            # Ensure all fields are JSON-serializable
            for key, val in d.items():
                if hasattr(val, 'isoformat'):
                    d[key] = val.isoformat()
            results.append(d)
        results.sort(key=lambda r: r.get("attempted_at", ""), reverse=True)
        return {"results": results}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to load quiz results: {e}")


# ── Activities ───────────────────────────────────────────────

def _log_activity(student_id: str, student_email: str, activity_type: str, course_id: str = "", module_id: str = "", detail: str = ""):
    """Helper to log an activity to Firestore."""
    try:
        doc_ref = db.collection("activities").document()
        doc_ref.set({
            "student_id": student_id,
            "student_email": student_email,
            "type": activity_type,
            "course_id": course_id,
            "module_id": module_id,
            "detail": detail,
            "created_at": firestore.SERVER_TIMESTAMP,
        })
    except Exception:
        pass  # Activity logging should never break the main flow


@router.get("/my-activities")
async def get_my_activities(user: dict = Depends(get_current_user)):
    """Fetches recent activities for the current student."""
    try:
        docs = db.collection("activities").where(
            filter=FieldFilter("student_id", "==", user["uid"])
        ).stream()
        results = []
        for doc in docs:
            d = doc.to_dict()
            if d is None:
                continue
            d["id"] = doc.id
            for key, val in d.items():
                if hasattr(val, 'isoformat'):
                    d[key] = val.isoformat()
            results.append(d)
        results.sort(key=lambda r: r.get("created_at", ""), reverse=True)
        return {"activities": results[:20]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load activities: {e}")


@router.get("/my-dashboard-stats")
async def get_my_dashboard_stats(user: dict = Depends(get_current_user)):
    """Returns learner dashboard stats: enrolled courses, completed modules, streak, achievements."""
    try:
        uid = user["uid"]
        # 1. Profile → enrollments & completed modules
        user_doc = db.collection("users").document(uid).get()
        user_data = user_doc.to_dict() if user_doc.exists else {}
        enrollments = user_data.get("enrollments", {})
        enrolled_count = len(enrollments)
        completed_modules_total = sum(
            len(e.get("completed_modules", [])) for e in enrollments.values()
        )

        # Count total modules across enrolled courses
        total_modules = 0
        courses_completed = 0
        for cid in enrollments:
            mods = db.collection("courses").document(cid).collection("modules").get()
            course_total = len(mods)
            total_modules += course_total
            completed_in_course = len(enrollments[cid].get("completed_modules", []))
            if course_total > 0 and completed_in_course >= course_total:
                courses_completed += 1

        # 2. Activities → streak + achievements
        activity_docs = db.collection("activities").where(
            filter=FieldFilter("student_id", "==", uid)
        ).stream()
        activity_dates = set()
        quiz_passed_count = 0
        for doc in activity_docs:
            d = doc.to_dict()
            if d is None:
                continue
            created = d.get("created_at")
            if created:
                if hasattr(created, 'date'):
                    activity_dates.add(created.date())
                elif isinstance(created, str):
                    try:
                        activity_dates.add(datetime.fromisoformat(created.replace("Z", "+00:00")).date())
                    except Exception:
                        pass
            if d.get("type") == "quiz_attempt" and "Passed" in d.get("detail", ""):
                quiz_passed_count += 1

        # Calculate streak (consecutive days ending today or yesterday)
        from datetime import date, timedelta
        today = date.today()
        streak = 0
        check_day = today
        while check_day in activity_dates:
            streak += 1
            check_day -= timedelta(days=1)
        # If no activity today, start from yesterday
        if streak == 0:
            check_day = today - timedelta(days=1)
            while check_day in activity_dates:
                streak += 1
                check_day -= timedelta(days=1)

        # Simple achievements
        achievements = 0
        achievement_list = []
        if enrolled_count >= 1:
            achievements += 1
            achievement_list.append("First Enrollment")
        if completed_modules_total >= 1:
            achievements += 1
            achievement_list.append("First Module Done")
        if quiz_passed_count >= 1:
            achievements += 1
            achievement_list.append("Quiz Master")
        if courses_completed >= 1:
            achievements += 1
            achievement_list.append("Course Graduate")
        if streak >= 3:
            achievements += 1
            achievement_list.append("3-Day Streak")
        if streak >= 7:
            achievements += 1
            achievement_list.append("Week Warrior")

        return {
            "enrolled_count": enrolled_count,
            "completed_modules": completed_modules_total,
            "total_modules": total_modules,
            "courses_completed": courses_completed,
            "streak_days": streak,
            "achievements": achievements,
            "achievement_list": achievement_list,
            "quizzes_passed": quiz_passed_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load dashboard stats: {e}")


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
                    "completed_at": None,
                })

        # For students who completed 100%, find the completion date from activities
        completed_student_ids = [s["student_id"] for s in analytics if s["progress"] == 100]
        if completed_student_ids:
            for sid in completed_student_ids:
                act_docs = db.collection("activities").where(
                    filter=FieldFilter("student_id", "==", sid)
                ).where(
                    filter=FieldFilter("course_id", "==", course_id)
                ).where(
                    filter=FieldFilter("type", "==", "module_complete")
                ).stream()
                latest = None
                for adoc in act_docs:
                    ad = adoc.to_dict()
                    created = ad.get("created_at")
                    if created:
                        ts = created.isoformat() if hasattr(created, 'isoformat') else str(created)
                        if latest is None or ts > latest:
                            latest = ts
                # Set completed_at on the matching student
                for s in analytics:
                    if s["student_id"] == sid and latest:
                        s["completed_at"] = latest

        return {"total_modules": total_modules, "students": analytics}
    except Exception as e:
        print(f"Error fetching analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Community Posts ──────────────────────────────────────────

@router.get("/community-posts/all")
async def get_community_posts(user: dict = Depends(get_current_user)):
    """Returns all community posts, newest first."""
    try:
        docs = db.collection("community_posts").order_by(
            "created_at", direction=firestore.Query.DESCENDING
        ).stream()
        posts = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            created = data.get("created_at")
            if hasattr(created, "isoformat"):
                data["created_at"] = created.isoformat()
            comments = data.get("comments", [])
            for c in comments:
                ca = c.get("created_at")
                if hasattr(ca, "isoformat"):
                    c["created_at"] = ca.isoformat()
            posts.append(data)
        return posts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/community-posts/create")
async def create_community_post(body: CommunityPostRequest, user: dict = Depends(get_current_user)):
    """Creates a new community post stored in Firestore."""
    try:
        author_name = _resolve_user_name(user["uid"], token_data=user)
        doc_ref = db.collection("community_posts").document()
        post_data = {
            "author_id": user["uid"],
            "author_username": author_name,
            "course_id": body.course_id,
            "subject": body.subject,
            "message": body.message,
            "comments": [],
            "reactions": {},
            "created_at": datetime.utcnow().isoformat(),
        }
        # Resolve course title
        course_doc = db.collection("courses").document(body.course_id).get()
        if course_doc.exists:
            post_data["course_title"] = course_doc.to_dict().get("title", "Unknown Course")
        else:
            post_data["course_title"] = "Unknown Course"

        doc_ref.set(post_data)
        post_data["id"] = doc_ref.id
        return post_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/community-posts/{post_id}/comments")
async def add_comment(post_id: str, body: CommentRequest, user: dict = Depends(get_current_user)):
    """Adds a comment to an existing community post."""
    try:
        doc_ref = db.collection("community_posts").document(post_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Post not found")

        author_name = _resolve_user_name(user["uid"], token_data=user)
        comment = {
            "author_id": user["uid"],
            "author_username": author_name,
            "content": body.content,
            "created_at": datetime.utcnow().isoformat(),
        }
        doc_ref.update({"comments": ArrayUnion([comment])})
        return comment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/community-posts/{post_id}/react")
async def toggle_reaction(post_id: str, body: ReactionRequest, user: dict = Depends(get_current_user)):
    """Toggles a reaction (emoji) on a community post for the current user."""
    try:
        doc_ref = db.collection("community_posts").document(post_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Post not found")

        data = doc.to_dict()
        reactions = data.get("reactions", {})
        emoji = body.emoji
        uid = user["uid"]

        user_list = reactions.get(emoji, [])
        if uid in user_list:
            user_list.remove(uid)
        else:
            user_list.append(uid)

        if user_list:
            reactions[emoji] = user_list
        else:
            reactions.pop(emoji, None)

        doc_ref.update({"reactions": reactions})
        return {"reactions": reactions}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/community-posts/{post_id}")
async def delete_community_post(post_id: str, user: dict = Depends(get_current_user)):
    """Deletes a community post (only author can delete)."""
    try:
        doc_ref = db.collection("community_posts").document(post_id)
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Post not found")
        if doc.to_dict().get("author_id") != user["uid"]:
            raise HTTPException(status_code=403, detail="You can only delete your own posts")
        doc_ref.delete()
        return {"message": "Post deleted"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))