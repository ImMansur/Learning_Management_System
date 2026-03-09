import { useState, useEffect, useCallback } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getMyCourses, getCourseModules, getCourseAnalytics, getCourseQuizResults, BackendCourse, BackendModule, CourseAnalytics, QuizResult } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
} from "recharts";
import { Users, BookOpen, TrendingUp, GraduationCap, Loader2, BarChart3, Filter, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { mockQuizResults } from "@/data/mockQuizResults";

interface CourseData {
  course: BackendCourse;
  modules: BackendModule[];
  analytics: CourseAnalytics;
  quizResults: QuizResult[];
}

const COURSE_COLORS = ["#3b82f6", "#f97316", "#10b981", "#f43f5e", "#a855f7", "#14b8a6", "#eab308", "#6366f1"];
const STATUS_COLORS = { completed: "#22c55e", onTrack: "#3b82f6", inProgress: "#f59e0b", needsSupport: "#ef4444" };
const BAR_ENROLLMENT = { enrolled: "#3b82f6", avgProgress: "#f97316" };
const QUIZ_COLORS = { passed: "#22c55e", failed: "#ef4444", avgScore: "#3b82f6" };

const TrainerAnalytics = () => {
  const { user, getToken } = useUser();
  const [data, setData] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizCourseFilter, setQuizCourseFilter] = useState<string>("all");
  const [quizStatusFilter, setQuizStatusFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = await getToken();
      const courses = await getMyCourses(token);
      const results = await Promise.all(
        courses.map(async (course) => {
          const [modules, analytics, quizData] = await Promise.all([
            getCourseModules(token, course.id).catch(() => [] as BackendModule[]),
            getCourseAnalytics(token, course.id).catch(() => ({ total_modules: 0, students: [] } as CourseAnalytics)),
            getCourseQuizResults(token, course.id).catch(() => ({ results: [] as QuizResult[] })),
          ]);
          return { course, modules, analytics, quizResults: quizData.results };
        })
      );

      // If no real quiz results exist anywhere, inject mock data for showcase
      const hasAnyReal = results.some((r) => r.quizResults.length > 0);
      if (!hasAnyReal && results.length > 0) {
        // Distribute mock results across real courses and patch module IDs
        const courseBuckets = [0, 7, 12]; // split indices for 3 course buckets
        const patched = results.map((r, ci) => {
          const start = courseBuckets[ci] ?? courseBuckets[courseBuckets.length - 1];
          const end = courseBuckets[ci + 1] ?? mockQuizResults.length;
          const modIds = r.modules.map((m) => m.id);
          const slice = mockQuizResults.slice(start, end).map((mq, i) => ({
            ...mq,
            module_id: modIds.length > 0 ? modIds[i % modIds.length] : mq.module_id,
          }));
          return { ...r, quizResults: slice };
        });
        setData(patched);
      } else {
        setData(results);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [user, getToken]);

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

  // ── Compute KPIs ──
  const totalCourses = data.length;
  const totalModules = data.reduce((sum, d) => sum + d.modules.length, 0);
  const allStudents = data.flatMap((d) => d.analytics.students);
  const uniqueStudentIds = new Set(allStudents.map((s) => s.student_id));
  const totalStudents = uniqueStudentIds.size;
  const avgProgress = allStudents.length > 0
    ? Math.round(allStudents.reduce((sum, s) => sum + s.progress, 0) / allStudents.length)
    : 0;
  const completedCount = allStudents.filter((s) => s.progress === 100).length;
  const completionRate = allStudents.length > 0 ? Math.round((completedCount / allStudents.length) * 100) : 0;

  // ── Chart Data ──

  // 1. Students per course (bar chart)
  const studentsPerCourse = data.map((d) => ({
    name: d.course.title.length > 20 ? d.course.title.slice(0, 20) + "…" : d.course.title,
    students: d.analytics.students.length,
    avgProgress: d.analytics.students.length > 0
      ? Math.round(d.analytics.students.reduce((s, st) => s + st.progress, 0) / d.analytics.students.length)
      : 0,
  }));

  // 2. Progress distribution (pie chart)
  const progressDistribution = [
    { name: "Completed", value: allStudents.filter((s) => s.progress === 100).length, color: STATUS_COLORS.completed },
    { name: "On Track (75-99%)", value: allStudents.filter((s) => s.progress >= 75 && s.progress < 100).length, color: STATUS_COLORS.onTrack },
    { name: "In Progress (25-74%)", value: allStudents.filter((s) => s.progress >= 25 && s.progress < 75).length, color: STATUS_COLORS.inProgress },
    { name: "Needs Support (<25%)", value: allStudents.filter((s) => s.progress < 25).length, color: STATUS_COLORS.needsSupport },
  ].filter((d) => d.value > 0);

  // 3. Course completion radial
  const courseCompletionData = data.map((d, i) => {
    const students = d.analytics.students;
    const completed = students.filter((s) => s.progress === 100).length;
    const rate = students.length > 0 ? Math.round((completed / students.length) * 100) : 0;
    return {
      name: d.course.title.length > 18 ? d.course.title.slice(0, 18) + "…" : d.course.title,
      value: rate,
      fill: COURSE_COLORS[i % COURSE_COLORS.length],
    };
  });

  // 4. Quiz results data
  const allQuizResults = data.flatMap((d) =>
    d.quizResults.map((r) => ({ ...r, courseTitle: d.course.title, courseId: d.course.id }))
  );

  // Build module title lookup from all modules
  const moduleMap = new Map<string, string>();
  data.forEach((d) => d.modules.forEach((m) => moduleMap.set(m.id, m.title)));

  // Filtered quiz results
  const filteredQuizResults = allQuizResults.filter((r) => {
    if (quizCourseFilter !== "all" && r.courseId !== quizCourseFilter) return false;
    if (quizStatusFilter === "passed" && !r.passed) return false;
    if (quizStatusFilter === "failed" && r.passed) return false;
    return true;
  });

  // Quiz pass/fail by course (bar chart)
  const quizByCourse = data.map((d) => {
    const results = allQuizResults.filter((r) => r.courseId === d.course.id);
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const avg = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.score / r.total) * 100, 0) / results.length) : 0;
    return {
      name: d.course.title.length > 20 ? d.course.title.slice(0, 20) + "…" : d.course.title,
      passed,
      failed,
      avgScore: avg,
    };
  });

  // 5. Top students
  const topStudents = [...allStudents]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 8);

  return (
    <TrainerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive insights about your courses and student performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Courses", value: totalCourses, icon: BookOpen, color: "bg-accent/10 text-accent" },
          { label: "Modules", value: totalModules, icon: BarChart3, color: "bg-indigo-500/10 text-indigo-500" },
          { label: "Students", value: totalStudents, icon: Users, color: "bg-violet-500/10 text-violet-500" },
          { label: "Avg Progress", value: `${avgProgress}%`, icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-500" },
          { label: "Completion Rate", value: `${completionRate}%`, icon: GraduationCap, color: "bg-amber-500/10 text-amber-500" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Create courses to see analytics here.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Row 1: Students per course + Progress distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Enrollment by Course</CardTitle>
                <CardDescription>Number of enrolled students and their average progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentsPerCourse} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                      />
                      <Bar dataKey="students" name="Enrolled Students" fill={BAR_ENROLLMENT.enrolled} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgProgress" name="Avg Progress %" fill={BAR_ENROLLMENT.avgProgress} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: BAR_ENROLLMENT.enrolled }} />
                    <span className="text-xs text-muted-foreground">Enrolled Students — Total per course</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: BAR_ENROLLMENT.avgProgress }} />
                    <span className="text-xs text-muted-foreground">Avg Progress % — Mean completion</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Progress Distribution</CardTitle>
                <CardDescription>Student progress across all courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-52">
                  {progressDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={progressDistribution}
                          cx="50%" cy="50%"
                          innerRadius={45} outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                          label={({ name, value }) => `${value}`}
                        >
                          {progressDistribution.map((entry, i) => (
                            <Cell key={i} fill={entry.color} stroke={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                          formatter={(value: number, name: string) => [`${value} students`, name]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No student data</div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-border">
                  {[
                    { color: STATUS_COLORS.completed, label: "Completed", desc: "100% done" },
                    { color: STATUS_COLORS.onTrack, label: "On Track", desc: "75–99% progress" },
                    { color: STATUS_COLORS.inProgress, label: "In Progress", desc: "25–74% progress" },
                    { color: STATUS_COLORS.needsSupport, label: "Needs Support", desc: "Below 25%" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2">
                      <span className="w-2.5 h-2.5 rounded-full mt-0.5 flex-shrink-0" style={{ background: item.color }} />
                      <div>
                        <p className="text-xs font-medium text-foreground leading-tight">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>


            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz Results by Course</CardTitle>
                <CardDescription>Pass/fail breakdown and average score per course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {quizByCourse.some((d) => d.passed + d.failed > 0) ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={quizByCourse} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
                        />
                        <Bar dataKey="passed" name="Passed" fill={QUIZ_COLORS.passed} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="failed" name="Failed" fill={QUIZ_COLORS.failed} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No quiz attempts yet</div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: QUIZ_COLORS.passed }} />
                    <span className="text-xs text-muted-foreground">Passed — Scored 100%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: QUIZ_COLORS.failed }} />
                    <span className="text-xs text-muted-foreground">Failed — Below 100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          {/* Row 3: Quiz Results Table with Filters */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base">Quiz Attempts</CardTitle>
                  <CardDescription>Individual quiz results with filters</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                    <select
                      value={quizCourseFilter}
                      onChange={(e) => setQuizCourseFilter(e.target.value)}
                      className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="all">All Courses</option>
                      {data.map((d) => (
                        <option key={d.course.id} value={d.course.id}>{d.course.title}</option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={quizStatusFilter}
                    onChange={(e) => setQuizStatusFilter(e.target.value)}
                    className="text-xs bg-muted border border-border rounded-md px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="all">All Results</option>
                    <option value="passed">Passed Only</option>
                    <option value="failed">Failed Only</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredQuizResults.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No quiz attempts found</p>
              ) : (
                <div className="overflow-x-auto">
                  <div className="max-h-72 overflow-y-auto rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-3 text-xs font-medium text-muted-foreground">Student</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Course</th>
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Module</th>
                          <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Score</th>
                          <th className="text-center py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                          <th className="text-right py-2 pl-3 text-xs font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuizResults.map((r, i) => (
                          <tr key={r.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="py-2.5 pr-3">
                              <p className="font-medium text-foreground truncate max-w-[140px]">{r.student_name}</p>
                              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{r.student_email}</p>
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[120px]">{r.courseTitle}</td>
                            <td className="py-2.5 px-3 text-muted-foreground truncate max-w-[120px]">{moduleMap.get(r.module_id) || r.module_id}</td>
                            <td className="py-2.5 px-3 text-center">
                              <span className="font-semibold text-foreground">{r.score}/{r.total}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">({r.total > 0 ? Math.round((r.score / r.total) * 100) : 0}%)</span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {r.passed ? (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
                                  <XCircle className="w-3.5 h-3.5" /> Failed
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 pl-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                              {r.attempted_at ? new Date(r.attempted_at).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredQuizResults.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center mt-3">Showing {Math.min(filteredQuizResults.length, 5)} of {filteredQuizResults.length} results. Scroll to see more.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Row 3: Top students + Per-course summary table */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Performing Students</CardTitle>
                <CardDescription>Highest progress across all your courses</CardDescription>
              </CardHeader>
              <CardContent>
                {topStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">No students enrolled yet</p>
                ) : (
                  <div className="space-y-3">
                    {topStudents.map((student, i) => (
                      <div key={`${student.student_id}-${i}`} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent transition-all"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold text-foreground w-10 text-right">{student.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Course Summary</CardTitle>
                <CardDescription>Overview of all your courses at a glance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">Course</th>
                        <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">Students</th>
                        <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">Modules</th>
                        <th className="text-center py-2 px-2 text-xs font-medium text-muted-foreground">Avg %</th>
                        <th className="text-center py-2 pl-2 text-xs font-medium text-muted-foreground">Done</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((d) => {
                        const students = d.analytics.students;
                        const avg = students.length > 0
                          ? Math.round(students.reduce((s, st) => s + st.progress, 0) / students.length)
                          : 0;
                        const done = students.filter((s) => s.progress === 100).length;
                        return (
                          <tr key={d.course.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                            <td className="py-2.5 pr-4 font-medium text-foreground truncate max-w-[180px]">{d.course.title}</td>
                            <td className="py-2.5 px-2 text-center text-muted-foreground">{students.length}</td>
                            <td className="py-2.5 px-2 text-center text-muted-foreground">{d.modules.length}</td>
                            <td className="py-2.5 px-2 text-center">
                              <span className={`font-semibold ${avg >= 75 ? "text-emerald-500" : avg >= 50 ? "text-amber-500" : "text-muted-foreground"}`}>
                                {avg}%
                              </span>
                            </td>
                            <td className="py-2.5 pl-2 text-center text-muted-foreground">{done}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </TrainerLayout>
  );
};

export default TrainerAnalytics;
