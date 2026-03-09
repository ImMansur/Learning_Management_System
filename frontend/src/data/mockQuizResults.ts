import type { QuizResult } from "@/services/lmsService";

/**
 * Mock quiz results for demo/showcase purposes.
 * Each entry is keyed by a placeholder course ID ("__mock_course_1", etc.)
 * The real courseId will be patched in at runtime by TrainerAnalytics.
 */

export const mockQuizResults: QuizResult[] = [
  // ── Course 1 results ──
  { id: "mq1",  student_id: "s1", student_name: "Aarav Sharma",    student_email: "aarav.sharma@email.com",    module_id: "__mod1", score: 7, total: 7, passed: true,  attempted_at: "2026-02-28T09:15:00Z" },
  { id: "mq2",  student_id: "s2", student_name: "Priya Nair",      student_email: "priya.nair@email.com",      module_id: "__mod1", score: 5, total: 7, passed: false, attempted_at: "2026-02-28T10:20:00Z" },
  { id: "mq3",  student_id: "s3", student_name: "Rohan Mehta",     student_email: "rohan.mehta@email.com",     module_id: "__mod1", score: 7, total: 7, passed: true,  attempted_at: "2026-03-01T08:30:00Z" },
  { id: "mq4",  student_id: "s2", student_name: "Priya Nair",      student_email: "priya.nair@email.com",      module_id: "__mod1", score: 7, total: 7, passed: true,  attempted_at: "2026-03-01T14:05:00Z" },
  { id: "mq5",  student_id: "s4", student_name: "Sneha Patil",     student_email: "sneha.patil@email.com",     module_id: "__mod2", score: 6, total: 7, passed: false, attempted_at: "2026-03-02T11:10:00Z" },
  { id: "mq6",  student_id: "s1", student_name: "Aarav Sharma",    student_email: "aarav.sharma@email.com",    module_id: "__mod2", score: 7, total: 7, passed: true,  attempted_at: "2026-03-02T13:45:00Z" },
  { id: "mq7",  student_id: "s5", student_name: "Vikram Reddy",    student_email: "vikram.reddy@email.com",    module_id: "__mod2", score: 4, total: 7, passed: false, attempted_at: "2026-03-03T09:00:00Z" },

  // ── Course 2 results ──
  { id: "mq8",  student_id: "s1", student_name: "Aarav Sharma",    student_email: "aarav.sharma@email.com",    module_id: "__mod3", score: 7, total: 7, passed: true,  attempted_at: "2026-03-03T15:20:00Z" },
  { id: "mq9",  student_id: "s3", student_name: "Rohan Mehta",     student_email: "rohan.mehta@email.com",     module_id: "__mod3", score: 7, total: 7, passed: true,  attempted_at: "2026-03-04T10:30:00Z" },
  { id: "mq10", student_id: "s6", student_name: "Ananya Iyer",     student_email: "ananya.iyer@email.com",     module_id: "__mod3", score: 3, total: 7, passed: false, attempted_at: "2026-03-04T12:15:00Z" },
  { id: "mq11", student_id: "s4", student_name: "Sneha Patil",     student_email: "sneha.patil@email.com",     module_id: "__mod4", score: 7, total: 7, passed: true,  attempted_at: "2026-03-05T08:50:00Z" },
  { id: "mq12", student_id: "s6", student_name: "Ananya Iyer",     student_email: "ananya.iyer@email.com",     module_id: "__mod3", score: 7, total: 7, passed: true,  attempted_at: "2026-03-05T16:00:00Z" },

  // ── Course 3 results ──
  { id: "mq13", student_id: "s2", student_name: "Priya Nair",      student_email: "priya.nair@email.com",      module_id: "__mod5", score: 7, total: 7, passed: true,  attempted_at: "2026-03-06T09:30:00Z" },
  { id: "mq14", student_id: "s5", student_name: "Vikram Reddy",    student_email: "vikram.reddy@email.com",    module_id: "__mod5", score: 5, total: 7, passed: false, attempted_at: "2026-03-06T11:45:00Z" },
  { id: "mq15", student_id: "s7", student_name: "Karthik Joshi",   student_email: "karthik.joshi@email.com",   module_id: "__mod5", score: 7, total: 7, passed: true,  attempted_at: "2026-03-07T10:00:00Z" },
  { id: "mq16", student_id: "s5", student_name: "Vikram Reddy",    student_email: "vikram.reddy@email.com",    module_id: "__mod5", score: 7, total: 7, passed: true,  attempted_at: "2026-03-07T14:20:00Z" },
  { id: "mq17", student_id: "s8", student_name: "Divya Kulkarni",  student_email: "divya.kulkarni@email.com",  module_id: "__mod6", score: 6, total: 7, passed: false, attempted_at: "2026-03-08T08:15:00Z" },
  { id: "mq18", student_id: "s7", student_name: "Karthik Joshi",   student_email: "karthik.joshi@email.com",   module_id: "__mod6", score: 7, total: 7, passed: true,  attempted_at: "2026-03-08T13:30:00Z" },
];
