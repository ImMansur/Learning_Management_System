import { useState, useEffect, useCallback } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { getMyCourses, getCourseAnalytics, BackendCourse, CourseAnalytics } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

interface CourseWithAnalytics {
  course: BackendCourse;
  analytics: CourseAnalytics;
}

const StudentProgress = () => {
  const { user, getToken } = useUser();
  const [data, setData] = useState<CourseWithAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const courses = await getMyCourses(token);
      const results = await Promise.all(
        courses.map(async (course) => {
          const analytics = await getCourseAnalytics(token, course.id).catch(() => ({
            total_modules: 0,
            students: [],
          }));
          return { course, analytics } as CourseWithAnalytics;
        })
      );
      setData(results);
    } catch (err) {
      console.error("Failed to load student progress:", err);
      toast.error("Failed to load student progress");
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const allStudents = data.flatMap((d) => d.analytics.students);
  const totalStudents = allStudents.length;
  const avgProgress = totalStudents > 0
    ? Math.round(allStudents.reduce((sum, s) => sum + s.progress, 0) / totalStudents)
    : 0;

  return (
    <TrainerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Student Progress</h1>
        <p className="text-muted-foreground">Track your students' learning journey and engagement</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-foreground">{totalStudents}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg. Progress</p>
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
                  <p className="text-sm text-muted-foreground mb-1">Total Courses</p>
                  <p className="text-3xl font-bold text-foreground">{data.length}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Students List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Student Details</h2>
            {data.map(({ course, analytics }) => {
              if (analytics.students.length === 0) return null;

              return (
                <div key={course.id} className="bg-card rounded-xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border bg-muted/50">
                    <h3 className="font-semibold text-card-foreground">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.students.length} student{analytics.students.length !== 1 ? "s" : ""} enrolled · {analytics.total_modules} modules
                    </p>
                  </div>

                  <div className="divide-y divide-border">
                    {analytics.students
                      .sort((a, b) => b.progress - a.progress)
                      .map((student) => (
                        <div key={student.student_id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{student.name}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                            <span className="text-lg font-bold text-foreground">{student.progress}%</span>
                          </div>

                          <Progress value={student.progress} className="h-2 mb-3" />

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {student.completed_modules}/{analytics.total_modules} modules completed
                            </span>
                            {student.enrolled_at && (
                              <span>Enrolled: {new Date(student.enrolled_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}

            {data.every((d) => d.analytics.students.length === 0) && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No students enrolled in any of your courses yet.</p>
              </div>
            )}
          </div>
        </>
      )}
    </TrainerLayout>
  );
};

export default StudentProgress;
