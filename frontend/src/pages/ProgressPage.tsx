import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Progress } from "@/components/ui/progress";
import { getMyProfile, getCourseCatalog, getCourseModules, StudentProfile, BackendCourse } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { TrendingUp, Target, Award, Loader2 } from "lucide-react";

interface CourseProgress {
  course: BackendCourse;
  totalModules: number;
  completedModules: number;
  pct: number;
}

const ProgressPage = () => {
  const { user, getToken } = useUser();
  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [overallPct, setOverallPct] = useState(0);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const token = await getToken();
        const [profile, catalog] = await Promise.all([
          getMyProfile(token),
          getCourseCatalog(token),
        ]);

        const enrolledCourseIds = Object.keys(profile.enrollments || {});
        const enrolledCourses = catalog.filter((c) => enrolledCourseIds.includes(c.id));

        const progressList = await Promise.all(
          enrolledCourses.map(async (course) => {
            const modules = await getCourseModules(token, course.id).catch(() => []);
            const totalModules = modules.length;
            const completedModules = (profile.enrollments[course.id]?.completed_modules || []).length;
            const pct = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
            return { course, totalModules, completedModules, pct };
          })
        );

        setCourseProgress(progressList);

        const totalAll = progressList.reduce((s, p) => s + p.totalModules, 0);
        const doneAll = progressList.reduce((s, p) => s + p.completedModules, 0);
        setOverallPct(totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0);
      } catch (err) {
        console.error("Failed to load progress:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [user, getToken]);

  const completedCourses = courseProgress.filter((p) => p.pct === 100).length;

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Progress Tracker</h1>
        <p className="text-muted-foreground">Track your learning journey across all courses</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {[
          { label: "Overall Progress", value: `${overallPct}%`, icon: TrendingUp, color: "text-accent" },
          { label: "Courses Completed", value: `${completedCourses} / ${courseProgress.length}`, icon: Target, color: "text-info" },
          { label: "Certificates", value: `${completedCourses}`, icon: Award, color: "text-success" },
        ].map((stat, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-card-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Per-course progress */}
      {courseProgress.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <p className="text-muted-foreground">You haven't enrolled in any courses yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {courseProgress.map(({ course, totalModules, completedModules, pct }) => (
          <div key={course.id} className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                {course.title.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground">{course.title}</h3>
                <p className="text-xs text-muted-foreground">
                  {completedModules} of {totalModules} modules completed
                </p>
              </div>
              <span className="text-2xl font-bold text-foreground">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2.5" />
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default ProgressPage;
