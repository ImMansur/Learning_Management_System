/**
 * Azure OpenAI Service Integration
 * Proxied through the Flask backend API.
 */

import { apiUrl } from './apiConfig';

export interface SummarizeOptions {
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

/**
 * Generate an AI summary of transcript text via the backend.
 * @param text - The transcript text to summarize
 * @param options - Optional configuration for summarization
 * @returns AI-generated summary
 */
export async function summarizeText(
  text: string,
  options: SummarizeOptions = {}
): Promise<string> {
  const resp = await fetch(apiUrl('/api/ai/summarize'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      maxTokens: options.maxTokens ?? 500,
      temperature: options.temperature ?? 0.7,
      systemPrompt: options.systemPrompt ?? '',
    }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `AI summarization failed: ${resp.status}`);
  }

  const data = await resp.json();
  return data.summary;
}

/**
 * Generate a structured lesson summary with specific sections
 * @param transcript - The lesson transcript
 * @returns Structured AI summary
 */
export async function generateLessonSummary(transcript: string): Promise<string> {
  const resp = await fetch(apiUrl('/api/ai/lesson-summary'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Lesson summary generation failed: ${resp.status}`);
  }

  const data = await resp.json();
  return data.summary;
}
