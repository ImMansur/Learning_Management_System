/**
 * Azure Speech Service Integration
 * Proxied through the Flask backend API.
 */

import { apiUrl } from './apiConfig';

export interface TranscriptionStatus {
  status: 'NotStarted' | 'Running' | 'Succeeded' | 'Failed';
  links?: {
    files: string;
  };
  error?: string;
}

export interface TranscriptionResult {
  transcript: string;
  duration?: number;
}

/**
 * Submit a video for transcription via the backend.
 * @param videoUrl - Public URL of the video blob
 * @returns Transcription URL for status polling
 */
export async function submitTranscription(videoUrl: string): Promise<string> {
  const resp = await fetch(apiUrl('/api/transcription/submit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl }),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Transcription submission failed: ${resp.status}`);
  }
  const data = await resp.json();
  return data.transcriptionUrl;
}

/**
 * Check the status of a transcription job via the backend.
 */
export async function getTranscriptionStatus(
  transcriptionUrl: string
): Promise<TranscriptionStatus> {
  const resp = await fetch(
    apiUrl(`/api/transcription/status?transcriptionUrl=${encodeURIComponent(transcriptionUrl)}`)
  );
  if (!resp.ok) {
    throw new Error(`Failed to get transcription status: ${resp.status}`);
  }
  return resp.json();
}

/**
 * Poll transcription status until completion (client-side polling).
 */
export async function waitForTranscription(
  transcriptionUrl: string,
  onProgress?: (status: string) => void
): Promise<string> {
  const maxAttempts = 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getTranscriptionStatus(transcriptionUrl);
    onProgress?.(status.status);

    if (status.status === 'Succeeded') {
      if (!status.links?.files) {
        throw new Error('Transcription succeeded but no files URL returned');
      }
      return status.links.files;
    }

    if (status.status === 'Failed') {
      throw new Error(`Transcription failed: ${status.error || 'Unknown error'}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
    attempts++;
  }

  throw new Error('Transcription timed out after 10 minutes');
}

/**
 * Complete transcription pipeline via the backend (single call, blocks until done).
 * @param videoUrl - Public URL of the video blob
 * @param onProgress - Optional progress callback
 * @returns Transcript result
 */
export async function transcribeVideo(
  videoUrl: string,
  onProgress?: (status: string) => void
): Promise<TranscriptionResult> {
  onProgress?.('Submitting transcription…');

  const resp = await fetch(apiUrl('/api/transcription/transcribe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Transcription failed: ${resp.status}`);
  }

  onProgress?.('Complete');
  return resp.json();
}
