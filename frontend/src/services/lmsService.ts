/**
 * LMS Backend API Service
 * Central service connecting frontend to the FastAPI backend.
 * All endpoints require a Firebase ID token for authentication.
 */

import { API_BASE_URL } from "./apiConfig";

// ── Types ────────────────────────────────────────────────────

export interface BackendCourse {
  id: string;
  title: string;
  description?: string;
  category: string;
  instructor_id: string;
  instructor_name?: string;
  enrolled_count?: number;
  module_count?: number;
  is_published: boolean;
  created_at: string;
}

export interface BackendModule {
  id: string;
  title: string;
  video_blob_url: string;
  order_index: number;
  status: "processing" | "completed" | "failed";
  created_at?: string;
}

export interface ModuleAIAssets {
  status: string;
  summary_markdown: string;
  transcript_text: string;
  questions: AIQuizQuestion[];
  is_vectorized: boolean;
  error: string;
}

export interface AIQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

/** Raw format returned by the backend quiz generator */
interface RawQuizQuestion {
  question: string;
  options: Record<string, string> | string[];
  correct_answer?: string;
  correct?: string;
  explanation?: string;
}

export interface StudentProfile {
  email: string;
  displayName: string;
  role: string;
  enrollments: Record<
    string,
    {
      enrolled_at: string;
      completed_modules: string[];
    }
  >;
}

export interface CourseAnalytics {
  total_modules: number;
  students: {
    student_id: string;
    name: string;
    email: string;
    completed_modules: number;
    progress: number;
    enrolled_at: string | null;
    completed_at: string | null;
  }[];
}

// ── Helpers ──────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string>),
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ── Course Endpoints (Trainer) ──────────────────────────────

export async function createCourse(
  token: string,
  title: string,
  category: string,
  description: string = ""
): Promise<{ message: string; course_id: string }> {
  const form = new FormData();
  form.append("title", title);
  form.append("category", category);
  form.append("description", description);
  return apiFetch("/courses/", token, { method: "POST", body: form });
}

export async function getMyCourses(
  token: string
): Promise<BackendCourse[]> {
  return apiFetch("/courses/my-courses", token);
}

export async function uploadModule(
  token: string,
  courseId: string,
  title: string,
  videoFile: File
): Promise<{ message: string; module_id: string }> {
  const form = new FormData();
  form.append("title", title);
  form.append("file", videoFile);
  return apiFetch(`/courses/${encodeURIComponent(courseId)}/modules`, token, {
    method: "POST",
    body: form,
  });
}

export async function editModule(
  token: string,
  courseId: string,
  moduleId: string,
  title?: string,
  videoFile?: File
): Promise<{ message: string }> {
  const form = new FormData();
  if (title) form.append("title", title);
  if (videoFile) form.append("file", videoFile);
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
    token,
    { method: "PUT", body: form }
  );
}

export async function deleteCourseApi(
  token: string,
  courseId: string
): Promise<{ message: string }> {
  return apiFetch(`/courses/${encodeURIComponent(courseId)}`, token, {
    method: "DELETE",
  });
}

export async function deleteModuleApi(
  token: string,
  courseId: string,
  moduleId: string
): Promise<{ message: string }> {
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}`,
    token,
    { method: "DELETE" }
  );
}

export async function notifyLearners(
  token: string,
  courseId: string,
  subject: string,
  message: string
): Promise<{ message: string }> {
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/notify-learners`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ subject, message }),
    }
  );
}

export async function getCourseAnalytics(
  token: string,
  courseId: string
): Promise<CourseAnalytics> {
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/analytics`,
    token
  );
}

// ── Course Endpoints (Student) ──────────────────────────────

export async function getCourseCatalog(
  token: string
): Promise<BackendCourse[]> {
  return apiFetch("/courses/catalog", token);
}

export async function enrollInCourse(
  token: string,
  courseId: string
): Promise<{ message: string }> {
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/enroll`,
    token,
    { method: "POST" }
  );
}

export async function getCourseModules(
  token: string,
  courseId: string
): Promise<BackendModule[]> {
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/modules`,
    token
  );
}

export async function completeModule(
  token: string,
  courseId: string,
  moduleId: string
): Promise<{ message: string }> {
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/complete`,
    token,
    { method: "POST" }
  );
}

// ── Quiz Result Endpoints ───────────────────────────────────

export interface QuizResult {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  module_id: string;
  score: number;
  total: number;
  passed: boolean;
  attempted_at: string | null;
}

export async function submitQuizResult(
  token: string,
  courseId: string,
  moduleId: string,
  payload: { score: number; total: number; passed: boolean }
): Promise<{ message: string; id: string }> {
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/modules/${encodeURIComponent(moduleId)}/quiz-result`,
    token,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function getCourseQuizResults(
  token: string,
  courseId: string
): Promise<{ results: QuizResult[] }> {
  return apiFetch(
    `/courses/${encodeURIComponent(courseId)}/quiz-results`,
    token
  );
}

export async function getMyProfile(
  token: string
): Promise<StudentProfile> {
  return apiFetch("/courses/my-profile", token);
}

// ── Activities ─────────────────────────────────────────────

export interface Activity {
  id: string;
  student_id: string;
  student_email: string;
  type: string;
  course_id: string;
  module_id: string;
  detail: string;
  created_at: string;
}

export async function getMyActivities(
  token: string
): Promise<{ activities: Activity[] }> {
  return apiFetch("/courses/my-activities", token);
}

export interface DashboardStats {
  enrolled_count: number;
  completed_modules: number;
  total_modules: number;
  courses_completed: number;
  streak_days: number;
  achievements: number;
  achievement_list: string[];
  quizzes_passed: number;
}

export async function getMyDashboardStats(
  token: string
): Promise<DashboardStats> {
  return apiFetch("/courses/my-dashboard-stats", token);
}

// ── Community Posts Endpoints ───────────────────────────────

export interface CommunityPostComment {
  author_id: string;
  author_username: string;
  content: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  author_id: string;
  author_username: string;
  course_id: string;
  course_title: string;
  subject: string;
  message: string;
  comments: CommunityPostComment[];
  reactions: Record<string, string[]>;
  created_at: string;
}

export async function getCommunityPosts(
  token: string
): Promise<CommunityPost[]> {
  return apiFetch("/courses/community-posts/all", token);
}

export async function createCommunityPost(
  token: string,
  courseId: string,
  subject: string,
  message: string
): Promise<CommunityPost> {
  return apiFetch("/courses/community-posts/create", token, {
    method: "POST",
    body: JSON.stringify({ course_id: courseId, subject, message }),
  });
}

export async function addCommunityComment(
  token: string,
  postId: string,
  content: string
): Promise<CommunityPostComment> {
  return apiFetch(
    `/courses/community-posts/${encodeURIComponent(postId)}/comments`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    }
  );
}

export async function deleteCommunityPost(
  token: string,
  postId: string
): Promise<{ message: string }> {
  return apiFetch(
    `/courses/community-posts/${encodeURIComponent(postId)}`,
    token,
    { method: "DELETE" }
  );
}

export async function toggleReaction(
  token: string,
  postId: string,
  emoji: string
): Promise<{ reactions: Record<string, string[]> }> {
  return apiFetch(
    `/courses/community-posts/${encodeURIComponent(postId)}/react`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ emoji }),
    }
  );
}

// ── AI Endpoints ────────────────────────────────────────────

export async function getModuleAIAssets(
  moduleId: string
): Promise<ModuleAIAssets> {
  const res = await fetch(
    `${API_BASE_URL}/ai/module/${encodeURIComponent(moduleId)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Failed to fetch AI assets: ${res.status}`);
  }
  const data = await res.json();

  // Normalize quiz questions from backend format
  // Backend returns options as {A:"...", B:"...", ...} and correct_answer as "A"
  data.questions = (data.questions || []).map((raw: RawQuizQuestion) => {
    const keys = Array.isArray(raw.options)
      ? null
      : Object.keys(raw.options).sort();
    const options: string[] = keys
      ? keys.map((k) => (raw.options as Record<string, string>)[k])
      : (raw.options as string[]);
    const correctKey = raw.correct_answer || raw.correct || "";
    const correctIndex = keys
      ? keys.indexOf(correctKey)
      : options.indexOf(correctKey);
    return {
      question: raw.question,
      options,
      correctIndex: correctIndex >= 0 ? correctIndex : 0,
      explanation: raw.explanation,
    } as AIQuizQuestion;
  });

  return data as ModuleAIAssets;
}

export async function getModulePipelineStatus(
  moduleId: string
): Promise<{ status: string; error?: string }> {
  const res = await fetch(
    `${API_BASE_URL}/ai/module/${encodeURIComponent(moduleId)}`
  );
  if (!res.ok) return { status: "processing" };
  const data = await res.json();
  return { status: data.status || "processing", error: data.error };
}

export function getTTSStreamUrl(moduleId: string, lang: string): string {
  return `${API_BASE_URL}/ai/tts/stream?module_id=${encodeURIComponent(moduleId)}&lang=${encodeURIComponent(lang)}`;
}
