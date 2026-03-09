/**
 * Lesson AI Service
 * Orchestrates the complete pipeline via the Flask backend:
 * video transcription → AI summary generation
 */

import { apiUrl } from './apiConfig';
import { generateLessonSummary } from './azureOpenAIService';

export interface LessonAIResult {
  transcript: string;
  aiSummary: string;
  processingTime?: number;
}

export interface ProcessingProgress {
  stage: 'transcription' | 'summarization' | 'complete' | 'error';
  message: string;
  progress?: number;
}

/**
 * Process a video URL to generate transcript and AI summary via the backend.
 * @param videoUrl - Public URL of the video to process
 * @param onProgress - Callback for progress updates
 * @returns Complete lesson AI result with transcript and summary
 */
export async function processLessonVideo(
  videoUrl: string,
  onProgress?: (progress: ProcessingProgress) => void
): Promise<LessonAIResult> {
  try {
    onProgress?.({
      stage: 'transcription',
      message: 'Processing video (transcription + summarisation)…',
      progress: 10,
    });

    const resp = await fetch(apiUrl('/api/ai/process-lesson'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || `Processing failed: ${resp.status}`);
    }

    const data = await resp.json();

    onProgress?.({
      stage: 'complete',
      message: 'Processing complete',
      progress: 100,
    });

    return {
      transcript: data.transcript,
      aiSummary: data.aiSummary,
      processingTime: data.processingTime,
    };
  } catch (error) {
    onProgress?.({
      stage: 'error',
      message: error instanceof Error ? error.message : 'Processing failed',
      progress: 0,
    });
    throw error;
  }
}

/**
 * Batch process multiple lesson videos
 * @param videoUrls - Array of video URLs to process
 * @param onProgress - Callback for overall progress
 * @returns Array of results corresponding to input videos
 */
export async function batchProcessLessons(
  videoUrls: string[],
  onProgress?: (completed: number, total: number) => void
): Promise<LessonAIResult[]> {
  const results: LessonAIResult[] = [];

  for (let i = 0; i < videoUrls.length; i++) {
    const result = await processLessonVideo(videoUrls[i]);
    results.push(result);
    onProgress?.(i + 1, videoUrls.length);
  }

  return results;
}

/**
 * Regenerate AI summary from existing transcript
 * Useful when you want a new summary without re-transcribing
 * @param transcript - Existing transcript text
 * @returns New AI-generated summary
 */
export async function regenerateSummary(transcript: string): Promise<string> {
  return generateLessonSummary(transcript);
}
