import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrainerLayout from "@/components/TrainerLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { getMyCourses, getCourseAnalytics, BackendCourse, CourseAnalytics } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Search,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const TrainerCourseProgressDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"progress" | "name">("progress");
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
      setCourse(courses.find((c) => c.id === courseId) || null);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to load:", err);
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
        <div className="mb-8">
          <button
            onClick={() => navigate("/trainer/courses")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to courses
          </button>
        </div>
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-muted-foreground">Course not found</p>
          </CardContent>
        </Card>
      </TrainerLayout>
    );
  }

  const courseStudents = analytics.students;
  const avgProgress = courseStudents.length
    ? Math.round(courseStudents.reduce((sum, s) => sum + s.progress, 0) / courseStudents.length)
    : 0;
  const completedStudents = courseStudents.filter((s) => s.progress === 100).length;

  // Filter and sort
  const filteredStudents = courseStudents
    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  return (
    <TrainerLayout>
      <div className="mb-8">
        <button
          onClick={() => navigate("/trainer/courses")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </button>

        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{course.title}</h1>
          <p className="text-muted-foreground">Track student progress and engagement</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground mt-1">{courseStudents.length}</p>
              </div>
              <Users className="w-5 h-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Progress</p>
                <p className="text-2xl font-bold text-foreground mt-1">{avgProgress}%</p>
              </div>
              <BarChart3 className="w-5 h-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Modules</p>
                <p className="text-2xl font-bold text-foreground mt-1">{analytics.total_modules}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground mt-1">{completedStudents}</p>
              </div>
              <Target className="w-5 h-5 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Distribution */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Progress Distribution</CardTitle>
          <CardDescription>How students are progressing through the course</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { range: "0-25%", count: courseStudents.filter((s) => s.progress < 25).length, color: "bg-red-500" },
              { range: "25-50%", count: courseStudents.filter((s) => s.progress >= 25 && s.progress < 50).length, color: "bg-blue-500" },
              { range: "50-75%", count: courseStudents.filter((s) => s.progress >= 50 && s.progress < 75).length, color: "bg-yellow-500" },
              { range: "75-100%", count: courseStudents.filter((s) => s.progress >= 75).length, color: "bg-green-500" },
            ].map((item) => (
              <div key={item.range} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-16">{item.range}</span>
                <div className="flex-1 h-8 bg-muted rounded-lg overflow-hidden flex items-center">
                  <div
                    className={`h-full ${item.color} flex items-center justify-center transition-all`}
                    style={{ width: `${courseStudents.length ? (item.count / courseStudents.length) * 100 : 0}%` }}
                  >
                    {item.count > 0 && <span className="text-xs font-medium text-white px-2">{item.count}</span>}
                  </div>
                </div>
                <span className="text-sm font-medium text-foreground w-12">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Student Progress</CardTitle>
              <CardDescription>Detailed view of each student's progress</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "progress" | "name")}
                className="px-3 py-2 rounded-lg bg-muted border border-border text-foreground text-sm"
              >
                <option value="progress">Sort by Progress</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No students found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => {
                const status = student.progress === 100 ? "completed" : student.progress > 0 ? "active" : "inactive";
                return (
                  <div
                    key={student.student_id}
                    className="p-4 border border-border rounded-lg hover:border-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{student.name}</h4>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">{student.progress}%</p>
                        <Badge
                          variant={
                            status === "completed"
                              ? "default"
                              : status === "active"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs mt-1"
                        >
                          {status === "completed" && "✓ Completed"}
                          {status === "active" && "In Progress"}
                          {status === "inactive" && "Not Started"}
                        </Badge>
                      </div>
                    </div>

                    <Progress value={student.progress} className="h-2 mb-3" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">Modules Completed</p>
                        <p className="font-medium text-foreground">
                          {student.completed_modules} / {analytics.total_modules}
                        </p>
                      </div>
                      {student.enrolled_at && (
                        <div>
                          <p className="text-muted-foreground text-xs mb-1">Enrolled Date</p>
                          <p className="font-medium text-foreground">{new Date(student.enrolled_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TrainerLayout>
  );
};

export default TrainerCourseProgressDetail;
