/**
 * Video Upload Service
 * Uploads videos to the Flask backend (saved locally) and receives
 * AI-generated transcript + summary in one call.
 */

import { apiUrl } from './apiConfig';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  /** Local filename stored on server */
  localFilename: string;
  /** URL to stream/access the video */
  videoUrl: string;
  /** File size in bytes */
  size: number;
  /** AI-generated transcript (may be empty if AI failed) */
  transcript: string;
  /** AI-generated summary (may be empty if AI failed) */
  aiSummary: string;
  /** Processing time in ms */
  processingTime: number;
}

/**
 * Upload a video to the backend. The server saves it locally and runs
 * transcription + AI summary, returning everything in one response.
 *
 * @param file - Video file to upload
 * @param courseId - Course ID
 * @param lessonId - Lesson ID
 * @param onProgress - Upload progress callback
 * @returns Upload result with video URL, transcript, and AI summary
 */
export async function uploadVideoToBlob(
  file: File,
  courseId: string,
  lessonId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> {
  // Client-side validation
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only video files are supported (MP4, WebM, OGG, MOV)');
  }
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 500MB limit');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('courseId', courseId);
  formData.append('lessonId', lessonId);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl('/api/upload/video'));

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        const err = JSON.parse(xhr.responseText || '{}');
        reject(new Error(err.error || `Upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}

/**
 * Delete a locally-stored video file (e.g. if trainer cancels).
 */
export async function deleteLocalVideo(localFilename: string): Promise<void> {
  const resp = await fetch(apiUrl('/api/upload/delete'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ localFilename }),
  });
  if (!resp.ok) {
    console.warn('Failed to delete local video:', localFilename);
  }
}
