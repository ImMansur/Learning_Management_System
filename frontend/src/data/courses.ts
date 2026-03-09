import courseAi from "@/assets/course-ai.jpg";
import courseData from "@/assets/course-data.jpg";
import courseCloud from "@/assets/course-cloud.jpg";
import courseDevops from "@/assets/course-devops.jpg";
import { getCreatedCourses } from "@/services/courseService";

export interface Course {
  id: string;
  title: string;
  description: string;
  image: string;
  lessons: number;
  duration: string;
  students: number;
  progress?: number;
  category: string;
  modules: Module[];
  isCreated?: boolean; // Flag to identify user-created courses
  createdBy?: string; // Trainer who created it
  createdAt?: string; // Creation timestamp
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "reading" | "exercise" | "quiz";
  completed: boolean;
  videoUrl?: string; // Azure blob URL
  blobName?: string; // Azure blob name
}

// Static demo courses
const staticCourses: Course[] = [
  {
    id: "ai-ml-fundamentals",
    title: "AI & Machine Learning Fundamentals",
    description: "Master the core concepts of artificial intelligence and machine learning, from neural networks to transformers.",
    image: courseAi,
    lessons: 24,
    duration: "18h 30m",
    students: 156,
    progress: 68,
    category: "AI / ML",
    createdBy: "Sara",
    modules: [
      {
        id: "m1",
        title: "Introduction to AI",
        lessons: [
          { id: "l1", title: "What is Artificial Intelligence?", duration: "45m", type: "video", completed: true },
          { id: "l2", title: "History & Evolution of AI", duration: "30m", type: "reading", completed: true },
          { id: "l3", title: "Types of Machine Learning", duration: "50m", type: "video", completed: true },
          { id: "l4", title: "Hands-on: Your First ML Model", duration: "60m", type: "exercise", completed: false },
        ],
      },
      {
        id: "m2",
        title: "Deep Learning",
        lessons: [
          { id: "l5", title: "Neural Network Architecture", duration: "55m", type: "video", completed: false },
          { id: "l6", title: "Backpropagation Explained", duration: "40m", type: "video", completed: false },
          { id: "l7", title: "CNNs and Image Recognition", duration: "50m", type: "video", completed: false },
          { id: "l8", title: "Module Quiz", duration: "20m", type: "quiz", completed: false },
        ],
      },
      {
        id: "m3",
        title: "Transformers & LLMs",
        lessons: [
          { id: "l9", title: "Attention Is All You Need", duration: "60m", type: "video", completed: false },
          { id: "l10", title: "Building with LLM APIs", duration: "45m", type: "exercise", completed: false },
        ],
      },
    ],
  },
  {
    id: "data-engineering",
    title: "Data Engineering Pipeline Design",
    description: "Learn to build robust data pipelines, ETL processes, and data warehousing solutions at scale.",
    image: courseData,
    lessons: 18,
    duration: "14h",
    students: 98,
    progress: 35,
    category: "Data",
    createdBy: "Sara",
    modules: [
      {
        id: "m1",
        title: "Data Foundations",
        lessons: [
          { id: "l1", title: "Data Architecture Overview", duration: "40m", type: "video", completed: true },
          { id: "l2", title: "SQL Mastery", duration: "60m", type: "exercise", completed: true },
          { id: "l3", title: "NoSQL Databases", duration: "45m", type: "video", completed: false },
        ],
      },
    ],
  },
  {
    id: "cloud-computing",
    title: "Cloud Computing & Infrastructure",
    description: "Deploy and manage applications on cloud platforms with best practices for scalability and security.",
    image: courseCloud,
    lessons: 20,
    duration: "16h",
    students: 134,
    progress: 12,
    category: "Cloud",
    createdBy: "Sara",
    modules: [
      {
        id: "m1",
        title: "Cloud Fundamentals",
        lessons: [
          { id: "l1", title: "Cloud Service Models", duration: "35m", type: "video", completed: true },
          { id: "l2", title: "IaaS vs PaaS vs SaaS", duration: "25m", type: "reading", completed: false },
        ],
      },
    ],
  },
  {
    id: "devops-practices",
    title: "DevOps & CI/CD Practices",
    description: "Implement continuous integration, deployment pipelines, and infrastructure as code methodologies.",
    image: courseDevops,
    lessons: 16,
    duration: "12h",
    students: 87,
    category: "DevOps",
    createdBy: "Sara",
    modules: [
      {
        id: "m1",
        title: "DevOps Culture",
        lessons: [
          { id: "l1", title: "What is DevOps?", duration: "30m", type: "video", completed: false },
          { id: "l2", title: "CI/CD Pipeline Design", duration: "50m", type: "video", completed: false },
        ],
      },
    ],
  },
];

/**
 * Get all courses (static + user-created)
 * @returns Combined array of all courses
 */
export function getAllCourses(): Course[] {
  const createdCourses = getCreatedCourses();
  return [...staticCourses, ...createdCourses];
}

/**
 * Legacy export for backward compatibility
 */
export const courses = getAllCourses();
