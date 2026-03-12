import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Index from "./pages/Index";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import LessonPage from "./pages/LessonPage";
import ModuleQuiz from "./pages/ModuleQuiz";
import Assistant from "./pages/Assistant";
import ProgressPage from "./pages/ProgressPage";
import NotFound from "./pages/NotFound";
import LearnerSettings from "./pages/LearnerSettings";
import TrainerDashboard from "./pages/TrainerDashboard";
import CreateCourse from "./pages/CreateCourse";
import TrainerCourseEdit from "./pages/TrainerCourseEdit";
import StudentProgress from "./pages/StudentProgress";
import TrainerCourseDetail from "./pages/TrainerCourseDetail";
import TrainerCourseProgress from "./pages/TrainerCourseProgress";
import TrainerCourseManagement from "./pages/TrainerCourseManagement";
import TrainerCourseProgressDetail from "./pages/TrainerCourseProgressDetail";
import TrainerAnalytics from "./pages/TrainerAnalytics";
import TrainerSettings from "./pages/TrainerSettings";
import CommunityPosts from "./pages/CommunityPosts";
import LearnerUpdates from "./pages/LearnerUpdates";
import VideoDetailPage from "./pages/VideoDetailPage";
import VideoQuizPage from "./pages/VideoQuizPage";
import ProtectedRoute from "@/components/ProtectedRoute";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";
import ManageUsers from "./pages/ManageUsers";
import ManageCoursesAdmin from "./pages/ManageCoursesAdmin";
import ManageTrainers from "./pages/ManageTrainers";
import AdminAnalytics from "./pages/AdminAnalytics";
import AIMonitor from "./pages/AIMonitor";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute allowedRoles={["Learner"]}><Index /></ProtectedRoute>}
            />
            <Route
              path="/courses"
              element={<ProtectedRoute allowedRoles={["Learner"]}><Courses /></ProtectedRoute>}
            />
            <Route
              path="/courses/:id"
              element={<ProtectedRoute allowedRoles={["Learner"]}><CourseDetail /></ProtectedRoute>}
            />
            <Route
              path="/courses/:courseId/lesson/:lessonId"
              element={<ProtectedRoute allowedRoles={["Learner"]}><LessonPage /></ProtectedRoute>}
            />
            <Route
              path="/courses/:courseId/quiz/:moduleId"
              element={<ProtectedRoute allowedRoles={["Learner"]}><ModuleQuiz /></ProtectedRoute>}
            />
            <Route
              path="/assistant"
              element={<ProtectedRoute allowedRoles={["Learner"]}><Assistant /></ProtectedRoute>}
            />
            <Route
              path="/progress"
              element={<ProtectedRoute allowedRoles={["Learner"]}><ProgressPage /></ProtectedRoute>}
            />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={["Learner"]}><LearnerSettings /></ProtectedRoute>} />
            <Route
              path="/updates"
              element={<ProtectedRoute allowedRoles={["Learner"]}><LearnerUpdates /></ProtectedRoute>}
            />
            <Route
              path="/video/:videoId"
              element={<ProtectedRoute allowedRoles={["Learner", "Trainer"]}><VideoDetailPage /></ProtectedRoute>}
            />
            <Route
              path="/video/:videoId/quiz"
              element={<ProtectedRoute allowedRoles={["Learner", "Trainer"]}><VideoQuizPage /></ProtectedRoute>}
            />
            
            {/* Trainer Routes */}
            <Route
              path="/trainer/courses"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><TrainerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/trainer/create-course"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><CreateCourse /></ProtectedRoute>}
            />
            <Route
              path="/trainer/course/:courseId/edit"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><TrainerCourseEdit /></ProtectedRoute>}
            />
            <Route
              path="/trainer/course/:courseId"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><TrainerCourseDetail /></ProtectedRoute>}
            />
            <Route
              path="/trainer/course/:courseId/watch/:lessonId"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><LessonPage /></ProtectedRoute>}
            />
            <Route
              path="/trainer/course/:courseId/progress"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><TrainerCourseProgressDetail /></ProtectedRoute>}
            />
            <Route
              path="/trainer/courses-management"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><TrainerCourseManagement /></ProtectedRoute>}
            />
            <Route
              path="/trainer/students"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><StudentProgress /></ProtectedRoute>}
            />
            <Route
              path="/trainer/analytics"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><TrainerAnalytics /></ProtectedRoute>}
            />
            <Route
              path="/trainer/settings"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><TrainerSettings /></ProtectedRoute>}
            />
            <Route
              path="/trainer/community"
              element={<ProtectedRoute allowedRoles={["Trainer"]}><CommunityPosts /></ProtectedRoute>}
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={<ProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin/users"
              element={<ProtectedRoute allowedRoles={["Admin"]}><ManageUsers /></ProtectedRoute>}
            />
            <Route
              path="/admin/courses"
              element={<ProtectedRoute allowedRoles={["Admin"]}><ManageCoursesAdmin /></ProtectedRoute>}
            />
            <Route
              path="/admin/trainers"
              element={<ProtectedRoute allowedRoles={["Admin"]}><ManageTrainers /></ProtectedRoute>}
            />
            <Route
              path="/admin/analytics"
              element={<ProtectedRoute allowedRoles={["Admin"]}><AdminAnalytics /></ProtectedRoute>}
            />
            <Route
              path="/admin/ai"
              element={<ProtectedRoute allowedRoles={["Admin"]}><AIMonitor /></ProtectedRoute>}
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;