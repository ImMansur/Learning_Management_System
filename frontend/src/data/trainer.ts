export interface TrainerCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  modules: TrainerModule[];
  enrolledStudents: number;
  createdDate: string;
  status: "draft" | "published";
}

export interface TrainerModule {
  id: string;
  title: string;
  lessons: TrainerLesson[];
}

export interface TrainerLesson {
  id: string;
  title: string;
  type: "video" | "reading" | "exercise" | "quiz";
  contentUrl?: string;
  transcriptUrl?: string;
  slidesUrl?: string;
  createdDate: string;
}

export interface StudentProgress {
  studentId: string;
  studentName: string;
  email: string;
  courseId: string;
  overallProgress: number;
  completedLessons: number;
  totalLessons: number;
  enrollmentDate: string;
  lastAccessDate: string;
}

export const trainerCourses: TrainerCourse[] = [
  {
    id: "ai-ml-fundamentals",
    title: "AI & Machine Learning Fundamentals",
    description: "Master the core concepts of artificial intelligence and machine learning, from neural networks to transformers.",
    category: "AI / ML",
    enrolledStudents: 156,
    createdDate: "2025-09-15",
    status: "published",
    modules: [
      {
        id: "m1",
        title: "Introduction to AI",
        lessons: [
          { id: "l1", title: "What is Artificial Intelligence?", type: "video", contentUrl: "/videos/ai-intro.mp4", createdDate: "2025-09-15" },
          { id: "l2", title: "History & Evolution of AI", type: "reading", slidesUrl: "/slides/ai-history.pdf", createdDate: "2025-09-15" },
          { id: "l3", title: "Types of Machine Learning", type: "video", contentUrl: "/videos/ml-types.mp4", createdDate: "2025-09-16" },
        ],
      },
    ],
  },
  {
    id: "data-engineering",
    title: "Data Engineering Pipeline Design",
    description: "Learn to build robust data pipelines, ETL processes, and data warehousing solutions at scale.",
    category: "Data",
    enrolledStudents: 98,
    createdDate: "2025-08-20",
    status: "published",
    modules: [
      {
        id: "m1",
        title: "Data Foundations",
        lessons: [
          { id: "l1", title: "Data Architecture Overview", type: "video", contentUrl: "/videos/data-arch.mp4", createdDate: "2025-08-20" },
        ],
      },
    ],
  },
];

export const studentProgress: StudentProgress[] = [
  {
    studentId: "s1",
    studentName: "John Smith",
    email: "john@example.com",
    courseId: "ai-ml-fundamentals",
    overallProgress: 68,
    completedLessons: 18,
    totalLessons: 24,
    enrollmentDate: "2025-11-01",
    lastAccessDate: "2026-02-13",
  },
  {
    studentId: "s2",
    studentName: "Emma Davis",
    email: "emma@example.com",
    courseId: "ai-ml-fundamentals",
    overallProgress: 45,
    completedLessons: 11,
    totalLessons: 24,
    enrollmentDate: "2025-11-15",
    lastAccessDate: "2026-02-12",
  },
  {
    studentId: "s3",
    studentName: "Michael Johnson",
    email: "michael@example.com",
    courseId: "data-engineering",
    overallProgress: 82,
    completedLessons: 15,
    totalLessons: 18,
    enrollmentDate: "2025-10-01",
    lastAccessDate: "2026-02-13",
  },
  {
    studentId: "s4",
    studentName: "Sarah Wilson",
    email: "sarah@example.com",
    courseId: "ai-ml-fundamentals",
    overallProgress: 25,
    completedLessons: 6,
    totalLessons: 24,
    enrollmentDate: "2025-12-01",
    lastAccessDate: "2026-02-10",
  },
];
