/**
 * Backend API Configuration
 * Central URL for the Flask backend
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Helper to build a full API URL
 */
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
