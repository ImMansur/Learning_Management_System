import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  getCourseCatalog,
  getCourseModules,
  getMyProfile,
  enrollInCourse,
  completeModule,
  BackendCourse,
  BackendModule,
  StudentProfile,
} from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  PlayCircle,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  BookOpen,
  Lock,
  Loader2,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUser();

  const [course, setCourse] = useState<BackendCourse | null>(null);
  const [modules, setModules] = useState<BackendModule[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !id) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const [catalogData, modulesData, profileData] = await Promise.all([
          getCourseCatalog(token),
          getCourseModules(token, id),
          getMyProfile(token).catch(() => null),
        ]);
        const found = catalogData.find((c) => c.id === id) || null;
        setCourse(found);
        setModules(modulesData);
        setProfile(profileData);
      } catch (err) {
        console.error("Failed to fetch course detail:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user, getToken]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Course not found.</p>
          <Link to="/courses" className="text-accent hover:underline text-sm mt-2 inline-block">
            Back to courses
          </Link>
        </div>
      </AppLayout>
    );
  }

  const enrollment = profile?.enrollments?.[course.id];
  const isEnrolled = !!enrollment;
  const completedModules = new Set(enrollment?.completed_modules || []);
  const totalModules = modules.length;
  const completedCount = completedModules.size;
  const progressVal = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const token = await getToken();
      await enrollInCourse(token, course.id);
      toast.success("Successfully enrolled!");
      const updatedProfile = await getMyProfile(token).catch(() => null);
      setProfile(updatedProfile);
    } catch (err: any) {
      toast.error("Enrollment failed: " + (err.message || "Unknown error"));
    } finally {
      setEnrolling(false);
    }
  };

  const handleCompleteModule = async (moduleId: string) => {
    setCompletingId(moduleId);
    try {
      const token = await getToken();
      await completeModule(token, course.id, moduleId);
      toast.success("Module completed!");
      const updatedProfile = await getMyProfile(token).catch(() => null);
      setProfile(updatedProfile);
    } catch (err: any) {
      toast.error("Failed to mark complete: " + (err.message || "Unknown error"));
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <AppLayout>
      {/* Back */}
      <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </Link>

      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden mb-8 h-48 bg-gradient-primary">
        <div className="absolute inset-0 bg-gradient-hero/80 flex items-end p-8">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground mb-3 inline-block">
              {course.category}
            </span>
            <h1 className="text-3xl font-bold text-primary-foreground mb-2">{course.title}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Enrollment prompt */}
          {!isEnrolled && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-6 mb-6 text-center">
              <p className="text-sm text-foreground mb-3">
                Enroll in this course to access all modules and track your progress.
              </p>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                {enrolling ? "Enrolling..." : "Enroll Now"}
              </button>
            </div>
          )}

          {/* Modules */}
          {modules.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No modules have been added to this course yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules.map((mod, mi) => {
                const isCompleted = completedModules.has(mod.id);
                const isProcessing = mod.status === "processing";
                // Module is accessible if enrolled AND (first module OR previous module completed)
                const isLocked = !isEnrolled || (mi > 0 && !completedModules.has(modules[mi - 1].id));
                return (
                  <div key={mod.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                          {isLocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                          Module {mi + 1}: {mod.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {isProcessing
                            ? "AI is processing this module..."
                            : mod.status === "completed"
                            ? "AI content ready"
                            : mod.status === "failed"
                            ? "AI processing failed"
                            : ""}
                        </p>
                      </div>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-xs text-success font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>

                    <div className="px-6 py-4">
                      {isLocked ? (
                        <p className="text-sm text-muted-foreground">
                          {!isEnrolled ? "Enroll to access this module." : "Complete the previous module first."}
                        </p>
                      ) : (
                        <div className="flex items-center gap-3 flex-wrap">
                          {mod.status === "completed" && (
                            <Link
                              to={`/courses/${course.id}/lesson/${mod.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                            >
                              <PlayCircle className="w-4 h-4" /> Watch & Learn
                            </Link>
                          )}
                          {mod.status === "completed" && (
                            <Link
                              to={`/courses/${course.id}/quiz/${mod.id}`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors"
                            >
                              Take Quiz
                            </Link>
                          )}

                          {isProcessing && (
                            <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-semibold text-card-foreground mb-4">Your Progress</h3>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold text-foreground">{progressVal}%</p>
              <p className="text-sm text-muted-foreground mt-1">
                {completedCount} of {totalModules} modules
              </p>
            </div>
            <Progress value={progressVal} className="h-3 mb-6" />
            {isEnrolled && modules.length > 0 && (
              <Link
                to={`/courses/${course.id}/lesson/${modules[0].id}`}
                className="block w-full py-3 rounded-xl bg-gradient-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity text-center"
              >
                Continue Learning
              </Link>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-6 space-y-4">
            <h3 className="font-semibold text-card-foreground mb-2">Course Info</h3>
            <div className="flex items-center gap-3 text-sm">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{totalModules} modules</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{course.category}</span>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default CourseDetail;
