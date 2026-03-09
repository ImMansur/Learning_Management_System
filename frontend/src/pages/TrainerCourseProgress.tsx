import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrainerLayout from "@/components/TrainerLayout";
import { getMyCourses, getCourseAnalytics, BackendCourse, CourseAnalytics } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

const CourseProgress = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  const [course, setCourse] = useState<BackendCourse | null>(null);
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user || !courseId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const [courses, analyticsData] = await Promise.all([
        getMyCourses(token),
        getCourseAnalytics(token, courseId),
      ]);
      const found = courses.find((c) => c.id === courseId);
      setCourse(found || null);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to load course progress:", err);
      toast.error("Failed to load course progress");
    } finally {
      setLoading(false);
    }
  }, [user, courseId, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <TrainerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </TrainerLayout>
    );
  }

  if (!course || !analytics) {
    return (
      <TrainerLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Course not found.</p>
        </div>
      </TrainerLayout>
    );
  }

  const courseStudents = analytics.students;
  const avgProgress = courseStudents.length > 0
    ? Math.round(courseStudents.reduce((sum, s) => sum + s.progress, 0) / courseStudents.length)
    : 0;
  const completionRate = courseStudents.length > 0
    ? Math.round((courseStudents.filter((s) => s.progress === 100).length / courseStudents.length) * 100)
    : 0;

  return (
    <TrainerLayout>
      <button
        onClick={() => navigate("/trainer/courses")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Course Progress</h1>
        <p className="text-muted-foreground">{course.title}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Enrolled Students</p>
              <p className="text-3xl font-bold text-foreground">{courseStudents.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Average Progress</p>
              <p className="text-3xl font-bold text-foreground">{avgProgress}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
              <p className="text-3xl font-bold text-foreground">{completionRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center text-success">
              <span className="text-lg font-bold">✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* Student Breakdown */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border bg-muted/50">
          <h2 className="text-lg font-semibold text-card-foreground">Student Progress Breakdown</h2>
        </div>

        {courseStudents.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">No students enrolled yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {courseStudents.sort((a, b) => b.progress - a.progress).map((student) => (
              <div key={student.student_id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">{student.progress}%</p>
                    {student.enrolled_at && (
                      <p className="text-xs text-muted-foreground">Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <Progress value={student.progress} className="h-2 mb-3" />

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{student.completed_modules}/{analytics.total_modules} modules completed</span>
                </div>

                {/* Progress indicator */}
                <div className="mt-2 pt-2 border-t border-border/50">
                  {student.progress === 100 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-success/10 text-success font-medium">
                      ✓ Completed
                    </span>
                  )}
                  {student.progress >= 75 && student.progress < 100 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">
                      On Track
                    </span>
                  )}
                  {student.progress >= 50 && student.progress < 75 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-warning/10 text-warning font-medium">
                      In Progress
                    </span>
                  )}
                  {student.progress < 50 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-destructive/10 text-destructive font-medium">
                      Needs Support
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-semibold text-card-foreground mb-4">Progress Distribution</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed (100%)</span>
              <span className="font-medium">{courseStudents.filter((s) => s.progress === 100).length} students</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">On Track (75-99%)</span>
              <span className="font-medium">
                {courseStudents.filter((s) => s.progress >= 75 && s.progress < 100).length} students
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">In Progress (50-74%)</span>
              <span className="font-medium">
                {courseStudents.filter((s) => s.progress >= 50 && s.progress < 75).length} students
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Needs Support (0-49%)</span>
              <span className="font-medium">
                {courseStudents.filter((s) => s.progress < 50).length} students
              </span>
            </div>
          </div>
        </div>
      </div>
    </TrainerLayout>
  );
};

export default CourseProgress;
