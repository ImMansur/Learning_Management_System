import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TrainerLayout from "@/components/TrainerLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  getMyCourses,
  getCourseModules,
  getCourseAnalytics,
  deleteCourseApi,
  BackendCourse,
  BackendModule,
  CourseAnalytics,
} from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import {
  Edit3,
  BarChart3,
  Users,
  Trash2,
  Plus,
  TrendingUp,
  Book,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface CourseWithDetails extends BackendCourse {
  modules: BackendModule[];
  analytics?: CourseAnalytics;
}

const TrainerCourseManagement = () => {
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  const [courses, setCourses] = useState<CourseWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const myCourses = await getMyCourses(token);

      // Fetch modules and analytics for each course
      const detailed = await Promise.all(
        myCourses.map(async (c) => {
          const [modules, analytics] = await Promise.all([
            getCourseModules(token, c.id).catch(() => [] as BackendModule[]),
            getCourseAnalytics(token, c.id).catch(() => undefined),
          ]);
          return { ...c, modules, analytics } as CourseWithDetails;
        })
      );
      setCourses(detailed);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleDeleteCourse = async (courseId: string) => {
    setDeleting(true);
    try {
      const token = await getToken();
      await deleteCourseApi(token, courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setDeleteConfirm(null);
      toast.success("Course deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete course: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <TrainerLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </TrainerLayout>
    );
  }

  if (courses.length === 0) {
    return (
      <TrainerLayout>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Course Management</h1>
          <p className="text-muted-foreground">Manage, edit, and track your courses</p>
        </div>

        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Book className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No courses yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Create your first course to get started with managing and tracking student progress.
            </p>
            <Button onClick={() => navigate("/trainer/create-course")}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Course
            </Button>
          </CardContent>
        </Card>
      </TrainerLayout>
    );
  }

  const totalStudents = courses.reduce(
    (sum, c) => sum + (c.analytics?.students?.length || 0),
    0
  );

  return (
    <TrainerLayout>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Course Management</h1>
          <p className="text-muted-foreground">Manage, edit, and track your courses</p>
        </div>
        <Button onClick={() => navigate("/trainer/create-course")}>
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold text-foreground mt-1">{courses.length}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Book className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold text-foreground mt-1">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Published</p>
                <p className="text-3xl font-bold text-foreground mt-1">
                  {courses.filter((c) => c.is_published).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses List */}
      <div className="space-y-4">
        {courses.map((course) => {
          const studentCount = course.analytics?.students?.length || 0;
          const avgProgress =
            studentCount > 0
              ? Math.round(
                  course.analytics!.students.reduce((s, st) => s + st.progress, 0) / studentCount
                )
              : 0;

          return (
            <Card key={course.id} className="hover:border-accent/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{course.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Created {new Date(course.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge>{course.category}</Badge>
                  </div>

                  {/* Course Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 py-4 border-y border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Modules</p>
                      <p className="font-semibold text-foreground">{course.modules.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Category</p>
                      <p className="font-semibold text-foreground">{course.category}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">AI Status</p>
                      <p className="font-semibold text-foreground">
                        {course.modules.filter((m) => m.status === "completed").length}/
                        {course.modules.length} ready
                      </p>
                    </div>
                  </div>

                  {/* Student Progress */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {studentCount} student{studentCount !== 1 ? "s" : ""} enrolled
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Avg progress: {avgProgress}%
                        </span>
                      </div>
                    </div>
                    <Progress value={avgProgress} className="h-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/trainer/course/${course.id}/edit`)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/trainer/course/${course.id}/progress`)}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Progress
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteConfirm(course.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>

                  {/* Delete Confirmation */}
                  {deleteConfirm === course.id && (
                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-sm text-destructive font-medium mb-3">
                        Are you sure you want to delete this course? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={deleting}
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          {deleting ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                          ) : (
                            "Yes, Delete"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </TrainerLayout>
  );
};

export default TrainerCourseManagement;
