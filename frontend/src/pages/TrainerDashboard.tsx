import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import {
  getMyCourses,
  getCourseModules,
  getCourseAnalytics,
  deleteCourseApi,
  BackendCourse,
  BackendModule,
} from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { Plus, Users, BookOpen, Trash2, Loader2, AlertTriangle, Eye, ChevronDown, PlayCircle } from "lucide-react";
import { toast } from "sonner";

interface CourseWithModules extends BackendCourse {
  modules: BackendModule[];
}

const TrainerDashboard = () => {
  const location = useLocation();
  const { user, getToken } = useUser();
  const [courses, setCourses] = useState<CourseWithModules[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

  const fetchCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const myCourses = await getMyCourses(token);
      const withModules = await Promise.all(
        myCourses.map(async (c) => {
          const modules = await getCourseModules(token, c.id).catch(() => [] as BackendModule[]);
          return { ...c, modules } as CourseWithModules;
        })
      );
      setCourses(withModules);

      // Fetch student counts across all courses
      const analyticsResults = await Promise.all(
        myCourses.map((c) => getCourseAnalytics(token, c.id).catch(() => ({ total_modules: 0, students: [] })))
      );
      const uniqueStudentIds = new Set(analyticsResults.flatMap((a) => a.students.map((s) => s.student_id)));
      setTotalStudents(uniqueStudentIds.size);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchCourses();
  }, [location.key, fetchCourses]);

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    setDeletingId(courseId);
    try {
      const token = await getToken();
      await deleteCourseApi(token, courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      setDeleteConfirmId(null);
      toast.success(`"${courseTitle}" deleted successfully`);
    } catch (err: any) {
      toast.error("Delete failed: " + (err.message || "Unknown error"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <TrainerLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Courses</h1>
        <p className="text-muted-foreground">Manage your courses and track student progress</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-foreground">
                {loading ? "—" : courses.length}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Modules</p>
              <p className="text-3xl font-bold text-foreground">
                {loading ? "—" : courses.reduce((sum, c) => sum + c.modules.length, 0)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Students</p>
              <p className="text-3xl font-bold text-foreground">
                {loading ? "—" : totalStudents}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Create Course Button */}
      <Link
        to="/trainer/create-course"
        className="inline-flex items-center gap-2 mb-8 px-6 py-3 rounded-lg bg-gradient-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
      >
        <Plus className="w-5 h-5" />
        Create New Course
      </Link>

      {/* Loading */}
      {loading && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && courses.length === 0 && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No courses created yet. Click above to get started.</p>
        </div>
      )}

      {/* Courses */}
      {!loading && courses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-5">Your Courses</h2>
          <div className="space-y-4">
            {courses.map((course) => (
              <div key={course.id} className="bg-card rounded-xl border border-border p-6 hover:border-accent/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.category} · {course.modules.length} module{course.modules.length !== 1 ? "s" : ""} · Created {new Date(course.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="w-4 h-4" />
                        <span>{course.modules.filter((m) => m.status === "completed").length}/{course.modules.length} AI-processed</span>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-success/10 text-success font-medium">Published</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                      className="px-4 py-2 rounded-lg bg-accent/10 text-accent font-medium text-sm hover:bg-accent/20 transition-colors flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedCourseId === course.id ? "rotate-180" : ""}`} />
                    </button>
                    <Link
                      to={`/trainer/course/${course.id}/edit`}
                      className="px-4 py-2 rounded-lg bg-sidebar-accent text-sidebar-primary font-medium text-sm hover:opacity-90 transition-opacity"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/trainer/course/${course.id}/progress`}
                      className="px-4 py-2 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors"
                    >
                      Progress
                    </Link>
                    <button
                      onClick={() => setDeleteConfirmId(course.id)}
                      className="px-4 py-2 rounded-lg border border-destructive/50 text-destructive font-medium text-sm hover:bg-destructive/10 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expandable Module List */}
                {expandedCourseId === course.id && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Course Modules</p>
                    {course.modules.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No modules yet. Add modules in Edit.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {course.modules.map((mod, idx) => (
                          <Link
                            key={mod.id}
                            to={`/trainer/course/${course.id}/watch/${mod.id}`}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group"
                          >
                            <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="flex-1 text-sm text-foreground truncate">{mod.title}</span>
                            {mod.status === "completed" ? (
                              <span className="text-xs text-success font-medium">Ready</span>
                            ) : (
                              <span className="text-xs text-amber-500 font-medium">Processing</span>
                            )}
                            <PlayCircle className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Delete Confirmation */}
                {deleteConfirmId === course.id && (
                  <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-destructive font-medium mb-1">
                          Delete "{course.title}"?
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          This will permanently delete the course and all its modules. This action cannot be undone.
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeleteCourse(course.id, course.title)}
                            disabled={deletingId === course.id}
                            className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                          >
                            {deletingId === course.id ? (
                              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting...</>
                            ) : (
                              <><Trash2 className="w-3.5 h-3.5" /> Yes, Delete</>
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={deletingId === course.id}
                            className="px-4 py-2 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </TrainerLayout>
  );
};

export default TrainerDashboard;
