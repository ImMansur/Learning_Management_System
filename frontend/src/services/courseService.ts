/**
 * Course Management Service
 * Handles course creation, storage, and retrieval
 */

import { Course, Module } from '@/data/courses';
import { LessonContent } from '@/data/lessonContent';

const COURSES_STORAGE_KEY = 'ltc_created_courses';
const LESSON_CONTENT_STORAGE_KEY = 'ltc_lesson_content';

/**
 * Save a new course to storage
 * @param course - Course to save
 */
export function saveCourse(course: Course): void {
  const existingCourses = getCreatedCourses();
  
  // Check if course already exists
  const existingIndex = existingCourses.findIndex(c => c.id === course.id);
  
  if (existingIndex >= 0) {
    // Update existing course
    existingCourses[existingIndex] = course;
  } else {
    // Add new course
    existingCourses.push(course);
  }
  
  localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(existingCourses));
}

/**
 * Get all created courses from storage
 * @returns Array of created courses
 */
export function getCreatedCourses(): Course[] {
  const stored = localStorage.getItem(COURSES_STORAGE_KEY);
  
  if (!stored) {
    return [];
  }
  
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to parse created courses:', error);
    return [];
  }
}

/**
 * Get a course by ID from storage
 * @param courseId - Course ID
 * @returns Course or null if not found
 */
export function getCourseById(courseId: string): Course | null {
  const courses = getCreatedCourses();
  return courses.find(c => c.id === courseId) || null;
}

/**
 * Delete a course from storage
 * @param courseId - Course ID to delete
 */
export function deleteCourse(courseId: string): void {
  // Get the course to find all lesson IDs
  const course = getCourseById(courseId);
  
  if (course) {
    // Delete all lesson content for this course
    const lessonIds: string[] = [];
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        lessonIds.push(lesson.id);
      });
    });
    
    // Remove lesson content from storage
    const stored = localStorage.getItem(LESSON_CONTENT_STORAGE_KEY);
    if (stored) {
      try {
        const lessonContents = JSON.parse(stored);
        lessonIds.forEach(lessonId => {
          delete lessonContents[lessonId];
        });
        localStorage.setItem(LESSON_CONTENT_STORAGE_KEY, JSON.stringify(lessonContents));
      } catch (error) {
        console.error('Failed to clean up lesson content:', error);
      }
    }
  }
  
  // Delete the course
  const courses = getCreatedCourses();
  const filtered = courses.filter(c => c.id !== courseId);
  localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * Save lesson content (transcript + AI summary)
 * @param lessonId - Lesson ID
 * @param content - Lesson content
 */
export function saveLessonContent(lessonId: string, content: LessonContent): void {
  const stored = localStorage.getItem(LESSON_CONTENT_STORAGE_KEY);
  let lessonContents: Record<string, LessonContent> = {};
  
  if (stored) {
    try {
      lessonContents = JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse lesson content:', error);
    }
  }
  
  lessonContents[lessonId] = {
    ...content,
    lastUpdated: new Date().toISOString(),
  };
  
  localStorage.setItem(LESSON_CONTENT_STORAGE_KEY, JSON.stringify(lessonContents));
}

/**
 * Get lesson content by ID
 * @param lessonId - Lesson ID
 * @returns Lesson content or null
 */
export function getLessonContentById(lessonId: string): LessonContent | null {
  const stored = localStorage.getItem(LESSON_CONTENT_STORAGE_KEY);
  
  if (!stored) {
    return null;
  }
  
  try {
    const contents = JSON.parse(stored);
    return contents[lessonId] || null;
  } catch (error) {
    console.error('Failed to parse lesson content:', error);
    return null;
  }
}

/**
 * Generate a unique course ID
 * @param title - Course title
 * @returns Unique course ID
 */
export function generateCourseId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const timestamp = Date.now().toString(36);
  return `${slug}-${timestamp}`;
}

/**
 * Generate a unique module ID
 * @returns Unique module ID
 */
export function generateModuleId(): string {
  return `m${Date.now().toString(36)}`;
}

/**
 * Generate a unique lesson ID
 * @returns Unique lesson ID
 */
export function generateLessonId(): string {
  return `l${Date.now().toString(36)}`;
}

/**
 * Calculate total lessons and duration for a course
 * @param modules - Course modules
 * @returns Total lessons count and formatted duration
 */
export function calculateCourseStats(modules: Module[]): { lessons: number; duration: string } {
  let totalLessons = 0;
  let totalMinutes = 0;
  
  modules.forEach(module => {
    totalLessons += module.lessons.length;
    
    module.lessons.forEach(lesson => {
      // Parse duration like "45m" or "1h 30m"
      const match = lesson.duration.match(/(\d+)h?\s*(\d+)?m?/);
      if (match) {
        const hours = match[1].includes('h') ? parseInt(match[1]) : 0;
        const minutes = match[2] ? parseInt(match[2]) : (match[1].includes('m') ? parseInt(match[1]) : 0);
        totalMinutes += (hours * 60) + minutes;
      }
    });
  });
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  let duration = '';
  if (hours > 0) {
    duration += `${hours}h`;
  }
  if (minutes > 0) {
    duration += ` ${minutes}m`;
  }
  
  return {
    lessons: totalLessons,
    duration: duration.trim() || '0m',
  };
}
