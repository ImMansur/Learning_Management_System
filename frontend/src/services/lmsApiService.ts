/**
 * LMS Backend API Service
 * Connects to the FastAPI backend for video upload, AI processing, and RAG chat.
 */

import { API_BASE_URL } from './apiConfig';

export interface VideoItem {
  id: string;
  title: string;
  instructor_id: string;
  video_url: string;
  storage_path: string;
  filename: string;
  status: 'processing' | 'completed' | 'failed';
  created_at: string;
  summary: string;
  transcript: string;
}

export interface ChatResponse {
  course_id: string;
  question: string;
  answer: string;
}

/**
 * Upload a video to the backend. Triggers AI processing automatically.
 */
export async function uploadVideo(
  file: File,
  title: string,
  token: string
): Promise<{ message: string; video_id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('title', title);

  const res = await fetch(`${API_BASE_URL}/courses/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Upload failed');
  }
  return res.json();
}

/**
 * Fetch all uploaded videos from the backend.
 */
export async function getVideos(token: string): Promise<VideoItem[]> {
  const res = await fetch(`${API_BASE_URL}/courses/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Failed to fetch videos');
  }
  return res.json();
}

/**
 * Send a question to the RAG chatbot for a specific video/course.
 */
export async function chatWithCourse(
  courseId: string,
  question: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE_URL}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course_id: courseId, question }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Chat request failed');
  }
  return res.json();
}

/**
 * Get the TTS audio stream URL for a module summary in a given language.
 */
export function getTTSStreamUrl(moduleId: string, lang: string): string {
  return `${API_BASE_URL}/ai/tts/stream?module_id=${encodeURIComponent(moduleId)}&lang=${encodeURIComponent(lang)}`;
}

/**
 * Delete an AI-processed video and all associated resources.
 */
export async function deleteVideo(
  videoId: string,
  token: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/courses/${encodeURIComponent(videoId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || 'Delete failed');
  }
  return res.json();
}
