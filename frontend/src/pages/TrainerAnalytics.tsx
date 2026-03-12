import { useState, useEffect, useCallback } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { getMyCourses, getCourseModules, getCourseAnalytics, getCourseQuizResults, BackendCourse, BackendModule, CourseAnalytics, QuizResult } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line,
  AreaChart, Area,
} from "recharts";
import {
  Users, BookOpen, TrendingUp, GraduationCap, Loader2, BarChart3, Filter,
  CheckCircle2, XCircle, Download, FileSpreadsheet, RefreshCw, Award,
  Clock, Target,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx-js-style";

interface CourseData {
  course: BackendCourse;
  modules: BackendModule[];
  analytics: CourseAnalytics;
  quizResults: QuizResult[];
}

const COLORS = {
  accent: "#3b82f6",     // matches hsl(217 91% 60%) — theme accent
  accentDark: "#1e40af", // deeper accent for bar pairs
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#6b7280",
  teal: "#14b8a6",
  orange: "#f97316",
};
const CHART_PALETTE = [COLORS.accent, COLORS.teal, COLORS.orange, COLORS.success, COLORS.accentDark, COLORS.warning, COLORS.muted, COLORS.danger];
const STATUS_COLORS = { completed: COLORS.success, onTrack: COLORS.accent, inProgress: COLORS.warning, needsSupport: COLORS.danger };

// ── Excel Styling Palette ──
const XL = {
  headerFill: { fgColor: { rgb: "4F46E5" } },      // indigo-600
  headerFont: { bold: true, color: { rgb: "FFFFFF" }, sz: 11, name: "Calibri" },
  headerBorder: {
    top: { style: "thin", color: { rgb: "3730A3" } },
    bottom: { style: "thin", color: { rgb: "3730A3" } },
    left: { style: "thin", color: { rgb: "3730A3" } },
    right: { style: "thin", color: { rgb: "3730A3" } },
  },
  cellBorder: {
    top: { style: "thin", color: { rgb: "E5E7EB" } },
    bottom: { style: "thin", color: { rgb: "E5E7EB" } },
    left: { style: "thin", color: { rgb: "E5E7EB" } },
    right: { style: "thin", color: { rgb: "E5E7EB" } },
  },
  evenRow: { fgColor: { rgb: "F9FAFB" } },          // gray-50
  oddRow: { fgColor: { rgb: "FFFFFF" } },
  cellFont: { sz: 10, name: "Calibri", color: { rgb: "1F2937" } },
  statusPassed: { fgColor: { rgb: "DCFCE7" }, font: { bold: true, color: { rgb: "166534" }, sz: 10, name: "Calibri" } },
  statusFailed: { fgColor: { rgb: "FEE2E2" }, font: { bold: true, color: { rgb: "991B1B" }, sz: 10, name: "Calibri" } },
  statusCompleted: { fgColor: { rgb: "DCFCE7" }, font: { bold: true, color: { rgb: "166534" }, sz: 10, name: "Calibri" } },
  statusOnTrack: { fgColor: { rgb: "DBEAFE" }, font: { bold: true, color: { rgb: "1E40AF" }, sz: 10, name: "Calibri" } },
  statusInProgress: { fgColor: { rgb: "FEF3C7" }, font: { bold: true, color: { rgb: "92400E" }, sz: 10, name: "Calibri" } },
  statusNeedsSupport: { fgColor: { rgb: "FEE2E2" }, font: { bold: true, color: { rgb: "991B1B" }, sz: 10, name: "Calibri" } },
  kpiLabel: { fgColor: { rgb: "EEF2FF" }, font: { bold: true, color: { rgb: "4338CA" }, sz: 11, name: "Calibri" } },
  kpiValue: { font: { bold: true, color: { rgb: "1F2937" }, sz: 14, name: "Calibri" } },
  percentFont: { sz: 10, name: "Calibri", color: { rgb: "4338CA" }, bold: true },
  titleFont: { bold: true, color: { rgb: "FFFFFF" }, sz: 14, name: "Calibri" },
  titleFill: { fgColor: { rgb: "312E81" } },         // indigo-900
  subtitleFont: { bold: false, color: { rgb: "6B7280" }, sz: 9, name: "Calibri", italic: true },
} as const;

function getStatusStyle(status: string) {
  switch (status) {
    case "Completed": return XL.statusCompleted;
    case "Passed": return XL.statusPassed;
    case "On Track": return XL.statusOnTrack;
    case "In Progress": return XL.statusInProgress;
    case "Needs Support": return XL.statusNeedsSupport;
    case "Failed": return XL.statusFailed;
    default: return null;
  }
}

function downloadExcel(
  sheets: { name: string; data: Record<string, unknown>[]; statusCol?: string; percentCols?: string[] }[],
  filename: string,
  reportTitle?: string
) {
  const wb = XLSX.utils.book_new();

  for (const sheet of sheets) {
    if (sheet.data.length === 0) continue;
    const keys = Object.keys(sheet.data[0]);
    const numCols = keys.length;

    // Build rows: title row → blank → header → data
    const aoa: unknown[][] = [];

    // Row 0: Merged title
    const titleRow = new Array(numCols).fill("");
    titleRow[0] = reportTitle || sheet.name;
    aoa.push(titleRow);

    // Row 1: Subtitle with timestamp
    const subRow = new Array(numCols).fill("");
    subRow[0] = `Generated: ${new Date().toLocaleString()}  |  ${sheet.data.length} record${sheet.data.length !== 1 ? "s" : ""}`;
    aoa.push(subRow);

    // Row 2: Blank separator
    aoa.push(new Array(numCols).fill(""));

    // Row 3: Header
    aoa.push(keys);

    // Rows 4+: Data
    for (const row of sheet.data) {
      aoa.push(keys.map((k) => row[k] ?? ""));
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Merge title across all columns
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: numCols - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: numCols - 1 } },
    ];

    // Style title row
    for (let c = 0; c < numCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (ws[addr]) {
        ws[addr].s = { fill: XL.titleFill, font: XL.titleFont, alignment: { horizontal: "center", vertical: "center" }, border: XL.headerBorder };
      }
    }

    // Style subtitle row
    for (let c = 0; c < numCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: 1, c });
      if (!ws[addr]) ws[addr] = { v: "", t: "s" };
      ws[addr].s = { font: XL.subtitleFont, alignment: { horizontal: "center" }, fill: { fgColor: { rgb: "EEF2FF" } } };
    }

    // Style blank separator
    for (let c = 0; c < numCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: 2, c });
      if (!ws[addr]) ws[addr] = { v: "", t: "s" };
      ws[addr].s = { fill: { fgColor: { rgb: "FFFFFF" } } };
    }

    // Style header row (row index 3)
    for (let c = 0; c < numCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: 3, c });
      if (ws[addr]) {
        ws[addr].s = {
          fill: XL.headerFill,
          font: XL.headerFont,
          border: XL.headerBorder,
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
        };
      }
    }

    // Style data rows
    const statusColIdx = sheet.statusCol ? keys.indexOf(sheet.statusCol) : -1;
    const percentColIdxs = (sheet.percentCols || []).map((p) => keys.indexOf(p)).filter((i) => i >= 0);

    for (let r = 0; r < sheet.data.length; r++) {
      const isEven = r % 2 === 0;
      const excelRow = r + 4; // offset for title + subtitle + blank + header

      for (let c = 0; c < numCols; c++) {
        const addr = XLSX.utils.encode_cell({ r: excelRow, c });
        if (!ws[addr]) ws[addr] = { v: "", t: "s" };

        const cellStyle: Record<string, unknown> = {
          fill: isEven ? XL.evenRow : XL.oddRow,
          font: { ...XL.cellFont },
          border: XL.cellBorder,
          alignment: { vertical: "center", wrapText: false },
        };

        // Status column gets colored badge-style cells
        if (c === statusColIdx) {
          const val = String(ws[addr].v || "");
          const ss = getStatusStyle(val);
          if (ss) {
            cellStyle.fill = ss.fgColor ? { fgColor: ss.fgColor } : cellStyle.fill;
            cellStyle.font = ss.font || cellStyle.font;
            (cellStyle.alignment as Record<string, unknown>).horizontal = "center";
          }
        }

        // Percentage columns get indigo bold
        if (percentColIdxs.includes(c)) {
          cellStyle.font = { ...XL.percentFont };
          (cellStyle.alignment as Record<string, unknown>).horizontal = "center";
        }

        // Numbers get center aligned
        if (typeof ws[addr].v === "number") {
          (cellStyle.alignment as Record<string, unknown>).horizontal = "center";
        }

        ws[addr].s = cellStyle;
      }
    }

    // Auto-fit column widths (min 10, max 40)
    ws["!cols"] = keys.map((key, i) => {
      const maxLen = Math.max(
        key.length + 2,
        ...sheet.data.map((row) => String(row[key] ?? "").length)
      );
      return { wch: Math.max(10, Math.min(maxLen + 3, 40)) };
    });

    // Row height for title
    ws["!rows"] = [{ hpx: 32 }, { hpx: 20 }, { hpx: 8 }, { hpx: 24 }];

    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }

  XLSX.writeFile(wb, filename);
}

const TrainerAnalytics = () => {
  const { user, getToken } = useUser();
  const [data, setData] = useState<CourseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quizCourseFilter, setQuizCourseFilter] = useState<string>("all");
  const [quizStatusFilter, setQuizStatusFilter] = useState<string>("all");
  const [studentCourseFilter, setStudentCourseFilter] = useState<string>("all");

  const fetchData = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    else setRefreshing(true);
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

      setData(results);
      if (silent) toast.success("Analytics refreshed");
    } catch (err) {
      console.error("Failed to load analytics:", err);
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <TrainerLayout>
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
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
  const totalQuizAttempts = data.reduce((sum, d) => sum + d.quizResults.length, 0);
  const quizPassRate = totalQuizAttempts > 0
    ? Math.round((data.reduce((sum, d) => sum + d.quizResults.filter((r) => r.passed).length, 0) / totalQuizAttempts) * 100)
    : 0;

  // ── Chart Data ──

  // 1. Enrollment per course (bar)
  const studentsPerCourse = data.map((d, i) => ({
    name: d.course.title.length > 18 ? d.course.title.slice(0, 18) + "…" : d.course.title,
    fullName: d.course.title,
    students: d.analytics.students.length,
    avgProgress: d.analytics.students.length > 0
      ? Math.round(d.analytics.students.reduce((s, st) => s + st.progress, 0) / d.analytics.students.length)
      : 0,
    fill: CHART_PALETTE[i % CHART_PALETTE.length],
  }));

  // 2. Progress distribution (donut)
  const progressDistribution = [
    { name: "Completed", value: allStudents.filter((s) => s.progress === 100).length, color: STATUS_COLORS.completed },
    { name: "On Track (75-99%)", value: allStudents.filter((s) => s.progress >= 75 && s.progress < 100).length, color: STATUS_COLORS.onTrack },
    { name: "In Progress (25-74%)", value: allStudents.filter((s) => s.progress >= 25 && s.progress < 75).length, color: STATUS_COLORS.inProgress },
    { name: "Needs Support (<25%)", value: allStudents.filter((s) => s.progress < 25).length, color: STATUS_COLORS.needsSupport },
  ].filter((d) => d.value > 0);

  // 3. Per-course completion rate for area chart
  const courseCompletionArea = data.map((d) => {
    const students = d.analytics.students;
    const completed = students.filter((s) => s.progress === 100).length;
    const onTrack = students.filter((s) => s.progress >= 75 && s.progress < 100).length;
    const inProgress = students.filter((s) => s.progress >= 25 && s.progress < 75).length;
    const needsSupport = students.filter((s) => s.progress < 25).length;
    return {
      name: d.course.title.length > 15 ? d.course.title.slice(0, 15) + "…" : d.course.title,
      completed, onTrack, inProgress, needsSupport,
    };
  });

  // 4. Quiz results data
  const allQuizResults = data.flatMap((d) =>
    d.quizResults.map((r) => ({ ...r, courseTitle: d.course.title, courseId: d.course.id }))
  );

  const moduleMap = new Map<string, string>();
  data.forEach((d) => d.modules.forEach((m) => moduleMap.set(m.id, m.title)));

  const filteredQuizResults = allQuizResults.filter((r) => {
    if (quizCourseFilter !== "all" && r.courseId !== quizCourseFilter) return false;
    if (quizStatusFilter === "passed" && !r.passed) return false;
    if (quizStatusFilter === "failed" && r.passed) return false;
    return true;
  });

  // Quiz pass/fail by course (bar)
  const quizByCourse = data.map((d) => {
    const results = allQuizResults.filter((r) => r.courseId === d.course.id);
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const avg = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.score / r.total) * 100, 0) / results.length) : 0;
    return {
      name: d.course.title.length > 18 ? d.course.title.slice(0, 18) + "…" : d.course.title,
      passed, failed, avgScore: avg,
    };
  });

  // Quiz score distribution for line chart
  const quizScoreDistro = data.map((d) => {
    const results = allQuizResults.filter((r) => r.courseId === d.course.id);
    const avg = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.score / r.total) * 100, 0) / results.length) : 0;
    const passRate = results.length > 0 ? Math.round((results.filter((r) => r.passed).length / results.length) * 100) : 0;
    return {
      name: d.course.title.length > 15 ? d.course.title.slice(0, 15) + "…" : d.course.title,
      avgScore: avg, passRate, attempts: results.length,
    };
  });

  // 5. All students with course info (for student table)
  const allStudentsWithCourse = data.flatMap((d) =>
    d.analytics.students.map((s) => ({ ...s, courseTitle: d.course.title, courseId: d.course.id, totalModules: d.analytics.total_modules }))
  );
  const filteredStudents = studentCourseFilter === "all"
    ? allStudentsWithCourse
    : allStudentsWithCourse.filter((s) => s.courseId === studentCourseFilter);

  // 6. Top students
  const topStudents = [...allStudents]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 10);

  // ── Download Handlers ──

  const handleDownloadAll = () => {
    const sheets: { name: string; data: Record<string, unknown>[] }[] = [];

    // Sheet 1: Overview KPIs
    sheets.push({
      name: "Overview",
      percentCols: ["Average Progress (%)", "Completion Rate (%)", "Quiz Pass Rate (%)"],
      data: [{
        "Total Courses": totalCourses,
        "Total Modules": totalModules,
        "Total Students": totalStudents,
        "Average Progress (%)": avgProgress,
        "Completion Rate (%)": completionRate,
        "Quiz Attempts": totalQuizAttempts,
        "Quiz Pass Rate (%)": quizPassRate,
        "Report Generated": new Date().toLocaleString(),
      }],
    });

    // Sheet 2: Course Summary
    sheets.push({
      name: "Course Summary",
      percentCols: ["Average Progress (%)", "Completion Rate (%)", "Quiz Pass Rate (%)"],
      data: data.map((d) => {
        const students = d.analytics.students;
        const avg = students.length > 0 ? Math.round(students.reduce((s, st) => s + st.progress, 0) / students.length) : 0;
        const done = students.filter((s) => s.progress === 100).length;
        const quizzes = allQuizResults.filter((r) => r.courseId === d.course.id);
        const quizPassed = quizzes.filter((r) => r.passed).length;
        return {
          "Course Title": d.course.title,
          "Category": d.course.category,
          "Published": d.course.is_published ? "Yes" : "No",
          "Total Modules": d.modules.length,
          "Enrolled Students": students.length,
          "Average Progress (%)": avg,
          "Completed Students": done,
          "Completion Rate (%)": students.length > 0 ? Math.round((done / students.length) * 100) : 0,
          "Quiz Attempts": quizzes.length,
          "Quiz Passed": quizPassed,
          "Quiz Failed": quizzes.length - quizPassed,
          "Quiz Pass Rate (%)": quizzes.length > 0 ? Math.round((quizPassed / quizzes.length) * 100) : 0,
          "Created At": d.course.created_at ? new Date(d.course.created_at).toLocaleDateString() : "—",
        };
      }),
    });

    // Sheet 3: Student Progress
    sheets.push({
      name: "Student Progress",
      statusCol: "Status",
      percentCols: ["Progress (%)"],
      data: allStudentsWithCourse.map((s) => ({
        "Student Name": s.name,
        "Student Email": s.email,
        "Course": s.courseTitle,
        "Completed Modules": s.completed_modules,
        "Total Modules": s.totalModules,
        "Progress (%)": s.progress,
        "Status": s.progress === 100 ? "Completed" : s.progress >= 75 ? "On Track" : s.progress >= 25 ? "In Progress" : "Needs Support",
        "Enrolled At": s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : "—",
        "Completed At": s.completed_at ? new Date(s.completed_at).toLocaleDateString() : "—",
      })),
    });

    // Sheet 4: Quiz Results
    if (allQuizResults.length > 0) {
      sheets.push({
        name: "Quiz Results",
        statusCol: "Status",
        percentCols: ["Percentage (%)"],
        data: allQuizResults.map((r) => ({
          "Student Name": r.student_name,
          "Student Email": r.student_email,
          "Course": r.courseTitle,
          "Module": moduleMap.get(r.module_id) || r.module_id,
          "Score": r.score,
          "Total Questions": r.total,
          "Percentage (%)": r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
          "Status": r.passed ? "Passed" : "Failed",
          "Attempted At": r.attempted_at ? new Date(r.attempted_at).toLocaleDateString() : "—",
        })),
      });
    }

    // Sheet 5: Module Details
    sheets.push({
      name: "Module Details",
      data: data.flatMap((d) =>
        d.modules.map((m) => ({
          "Course": d.course.title,
          "Module Title": m.title,
          "Order": m.order_index + 1,
          "Processing Status": m.status,
          "Created At": m.created_at ? new Date(m.created_at).toLocaleDateString() : "—",
        }))
      ),
    });

    const today = new Date().toISOString().slice(0, 10);
    downloadExcel(sheets, `Trainer_Analytics_${today}.xlsx`, "Trainer Analytics Report");
    toast.success("Full analytics report downloaded");
  };

  const handleDownloadStudents = () => {
    const sheetData = filteredStudents.map((s) => ({
      "Student Name": s.name,
      "Student Email": s.email,
      "Course": s.courseTitle,
      "Completed Modules": s.completed_modules,
      "Total Modules": s.totalModules,
      "Progress (%)": s.progress,
      "Status": s.progress === 100 ? "Completed" : s.progress >= 75 ? "On Track" : s.progress >= 25 ? "In Progress" : "Needs Support",
      "Enrolled At": s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : "—",
      "Completed At": s.completed_at ? new Date(s.completed_at).toLocaleDateString() : "—",
    }));
    downloadExcel([{ name: "Student Progress", statusCol: "Status", percentCols: ["Progress (%)"], data: sheetData }], `Student_Progress_${new Date().toISOString().slice(0, 10)}.xlsx`, "Student Progress Report");
    toast.success("Student progress exported");
  };

  const handleDownloadQuizResults = () => {
    const sheetData = filteredQuizResults.map((r) => ({
      "Student Name": r.student_name,
      "Student Email": r.student_email,
      "Course": r.courseTitle,
      "Module": moduleMap.get(r.module_id) || r.module_id,
      "Score": r.score,
      "Total Questions": r.total,
      "Percentage (%)": r.total > 0 ? Math.round((r.score / r.total) * 100) : 0,
      "Status": r.passed ? "Passed" : "Failed",
      "Attempted At": r.attempted_at ? new Date(r.attempted_at).toLocaleDateString() : "—",
    }));
    downloadExcel([{ name: "Quiz Results", statusCol: "Status", percentCols: ["Percentage (%)"], data: sheetData }], `Quiz_Results_${new Date().toISOString().slice(0, 10)}.xlsx`, "Quiz Results Report");
    toast.success("Quiz results exported");
  };

  // ── Reusable tooltip style ──
  const tooltipStyle = {
    contentStyle: { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 10, fontSize: 12, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" },
    labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
  };

  return (
    <TrainerLayout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights about your courses and student performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchData(true)} disabled={refreshing} className="gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleDownloadAll} className="gap-1.5 bg-gradient-accent text-accent-foreground hover:opacity-90 border-0">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export All
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Courses", value: totalCourses, sub: `${totalModules} modules`, icon: BookOpen },
          { label: "Active Students", value: totalStudents, sub: `${allStudents.length} enrollments`, icon: Users },
          { label: "Avg Progress", value: `${avgProgress}%`, sub: `${completionRate}% completion`, icon: TrendingUp },
          { label: "Quiz Pass Rate", value: `${quizPassRate}%`, sub: `${totalQuizAttempts} attempts`, icon: Award },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{kpi.label}</p>
                <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <kpi.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Create courses to see analytics here.</p>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
              <BarChart3 className="w-3.5 h-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-1.5 text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5" /> Students
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-1.5 text-xs sm:text-sm">
              <GraduationCap className="w-3.5 h-3.5" /> Quizzes
            </TabsTrigger>
            <TabsTrigger value="courses" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="w-3.5 h-3.5" /> Courses
            </TabsTrigger>
          </TabsList>

          {/* ────── OVERVIEW TAB ────── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Enrollment + Progress Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-card rounded-xl border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Enrollment & Progress by Course</CardTitle>
                  <CardDescription>Students enrolled and their average completion per course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={studentsPerCourse} margin={{ top: 8, right: 16, left: 0, bottom: 45 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-30} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip {...tooltipStyle} />
                        <Bar dataKey="students" name="Enrolled" fill={COLORS.accent} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="avgProgress" name="Avg Progress %" fill={COLORS.teal} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-2 pt-3 border-t border-border">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.accent }} /> Enrolled</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.teal }} /> Avg Progress %</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card rounded-xl border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Progress Distribution</CardTitle>
                  <CardDescription>Overall student status breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-56">
                    {progressDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={progressDistribution}
                            cx="50%" cy="50%"
                            innerRadius={50} outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            strokeWidth={2}
                            stroke="hsl(var(--card))"
                          >
                            {progressDistribution.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip {...tooltipStyle} formatter={(value: number, name: string) => [`${value} students`, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No data</div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                    {[
                      { color: STATUS_COLORS.completed, label: "Completed", count: allStudents.filter((s) => s.progress === 100).length },
                      { color: STATUS_COLORS.onTrack, label: "On Track", count: allStudents.filter((s) => s.progress >= 75 && s.progress < 100).length },
                      { color: STATUS_COLORS.inProgress, label: "In Progress", count: allStudents.filter((s) => s.progress >= 25 && s.progress < 75).length },
                      { color: STATUS_COLORS.needsSupport, label: "Needs Help", count: allStudents.filter((s) => s.progress < 25).length },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
                        <span className="text-xs font-semibold text-foreground">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stacked area + top students */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card rounded-xl border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Student Status by Course</CardTitle>
                  <CardDescription>Breakdown of student progress categories</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={courseCompletionArea} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" />
                        <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <Tooltip {...tooltipStyle} />
                        <Area type="monotone" dataKey="completed" stackId="1" stroke={STATUS_COLORS.completed} fill={STATUS_COLORS.completed} fillOpacity={0.6} name="Completed" />
                        <Area type="monotone" dataKey="onTrack" stackId="1" stroke={STATUS_COLORS.onTrack} fill={STATUS_COLORS.onTrack} fillOpacity={0.6} name="On Track" />
                        <Area type="monotone" dataKey="inProgress" stackId="1" stroke={STATUS_COLORS.inProgress} fill={STATUS_COLORS.inProgress} fillOpacity={0.6} name="In Progress" />
                        <Area type="monotone" dataKey="needsSupport" stackId="1" stroke={STATUS_COLORS.needsSupport} fill={STATUS_COLORS.needsSupport} fillOpacity={0.6} name="Needs Support" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card rounded-xl border border-border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-accent" />
                    <CardTitle className="text-base font-semibold">Top Performing Students</CardTitle>
                  </div>
                  <CardDescription>Highest progress across all courses</CardDescription>
                </CardHeader>
                <CardContent>
                  {topStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No students enrolled yet</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                      {topStudents.map((student, i) => (
                        <div key={`${student.student_id}-${i}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            i < 3 ? "bg-accent/10 text-accent" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{student.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{student.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Progress value={student.progress} className="w-16 h-1.5" />
                            <Badge variant={student.progress === 100 ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                              {student.progress}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ────── STUDENTS TAB ────── */}
          <TabsContent value="students" className="space-y-6">
            <Card className="bg-card rounded-xl border border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Student Progress Tracker</CardTitle>
                    <CardDescription>Detailed progress of every enrolled student</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      <select
                        value={studentCourseFilter}
                        onChange={(e) => setStudentCourseFilter(e.target.value)}
                        className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="all">All Courses</option>
                        {data.map((d) => (
                          <option key={d.course.id} value={d.course.id}>{d.course.title}</option>
                        ))}
                      </select>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadStudents} className="gap-1.5 text-xs" disabled={filteredStudents.length === 0}>
                      <Download className="w-3 h-3" /> Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredStudents.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No students found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="max-h-[420px] overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                          <tr className="border-b border-border">
                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">#</th>
                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Student</th>
                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Course</th>
                            <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">Modules</th>
                            <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">Progress</th>
                            <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">Enrolled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((s, i) => {
                            const status = s.progress === 100 ? "Completed" : s.progress >= 75 ? "On Track" : s.progress >= 25 ? "In Progress" : "Needs Support";
                            const statusColor = s.progress === 100 ? "bg-success/10 text-success border-success/20" :
                              s.progress >= 75 ? "bg-accent/10 text-accent border-accent/20" :
                              s.progress >= 25 ? "bg-warning/10 text-warning border-warning/20" :
                              "bg-destructive/10 text-destructive border-destructive/20";
                            return (
                              <tr key={`${s.student_id}-${s.courseId}-${i}`} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-3 text-xs text-muted-foreground">{i + 1}</td>
                                <td className="py-2.5 px-3">
                                  <p className="font-medium text-foreground text-sm truncate max-w-[160px]">{s.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">{s.email}</p>
                                </td>
                                <td className="py-2.5 px-3 text-muted-foreground text-xs truncate max-w-[140px]">{s.courseTitle}</td>
                                <td className="py-2.5 px-3 text-center text-sm">
                                  <span className="font-semibold text-foreground">{s.completed_modules}</span>
                                  <span className="text-muted-foreground">/{s.totalModules}</span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center justify-center gap-2">
                                    <Progress value={s.progress} className="w-16 h-1.5" />
                                    <span className="text-xs font-semibold text-foreground w-9 text-right">{s.progress}%</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${statusColor}`}>{status}</Badge>
                                </td>
                                <td className="py-2.5 px-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                                  {s.enrolled_at ? new Date(s.enrolled_at).toLocaleDateString() : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ────── QUIZZES TAB ────── */}
          <TabsContent value="quizzes" className="space-y-6">
            {/* Quiz Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card rounded-xl border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Pass / Fail by Course</CardTitle>
                  <CardDescription>Quiz outcome distribution per course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {quizByCourse.some((d) => d.passed + d.failed > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizByCourse} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                          <Tooltip {...tooltipStyle} />
                          <Bar dataKey="passed" name="Passed" fill={COLORS.success} radius={[6, 6, 0, 0]} />
                          <Bar dataKey="failed" name="Failed" fill={COLORS.danger} radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No quiz attempts yet</div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-2 pt-3 border-t border-border">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.success }} /> Passed</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS.danger }} /> Failed</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card rounded-xl border border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Score Trends</CardTitle>
                  <CardDescription>Average score and pass rate per course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    {quizScoreDistro.some((d) => d.attempts > 0) ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={quizScoreDistro} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                          <Tooltip {...tooltipStyle} />
                          <Line type="monotone" dataKey="avgScore" name="Avg Score %" stroke={COLORS.accent} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.accent }} />
                          <Line type="monotone" dataKey="passRate" name="Pass Rate %" stroke={COLORS.success} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.success }} strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">No quiz data</div>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-2 pt-3 border-t border-border">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS.accent }} /> Avg Score</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full border-2 border-dashed" style={{ borderColor: COLORS.success }} /> Pass Rate</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quiz Attempts Table */}
            <Card className="bg-card rounded-xl border border-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold">Quiz Attempts</CardTitle>
                    <CardDescription>Individual quiz results with detailed scores</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                      <select
                        value={quizCourseFilter}
                        onChange={(e) => setQuizCourseFilter(e.target.value)}
                        className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                      className="text-xs bg-muted border border-border rounded-lg px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="all">All Results</option>
                      <option value="passed">Passed</option>
                      <option value="failed">Failed</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={handleDownloadQuizResults} className="gap-1.5 text-xs" disabled={filteredQuizResults.length === 0}>
                      <Download className="w-3 h-3" /> Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredQuizResults.length === 0 ? (
                  <div className="py-12 text-center">
                    <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No quiz attempts found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <div className="max-h-[380px] overflow-y-auto rounded-lg border border-border">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                          <tr className="border-b border-border">
                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Student</th>
                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Course</th>
                            <th className="text-left py-2.5 px-3 text-xs font-semibold text-muted-foreground">Module</th>
                            <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">Score</th>
                            <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">%</th>
                            <th className="text-center py-2.5 px-3 text-xs font-semibold text-muted-foreground">Status</th>
                            <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQuizResults.map((r) => {
                            const pct = r.total > 0 ? Math.round((r.score / r.total) * 100) : 0;
                            return (
                              <tr key={r.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-3">
                                  <p className="font-medium text-foreground truncate max-w-[140px]">{r.student_name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">{r.student_email}</p>
                                </td>
                                <td className="py-2.5 px-3 text-xs text-muted-foreground truncate max-w-[120px]">{r.courseTitle}</td>
                                <td className="py-2.5 px-3 text-xs text-muted-foreground truncate max-w-[120px]">{moduleMap.get(r.module_id) || r.module_id}</td>
                                <td className="py-2.5 px-3 text-center font-semibold text-foreground">{r.score}/{r.total}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${pct >= 70 ? "text-success border-success/30" : "text-destructive border-destructive/30"}`}>
                                    {pct}%
                                  </Badge>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {r.passed ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                                      <XCircle className="w-3.5 h-3.5" /> Failed
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right text-xs text-muted-foreground whitespace-nowrap">
                                  {r.attempted_at ? new Date(r.attempted_at).toLocaleDateString() : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      {filteredQuizResults.length} result{filteredQuizResults.length !== 1 ? "s" : ""}
                      {(quizCourseFilter !== "all" || quizStatusFilter !== "all") && " (filtered)"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ────── COURSES TAB ────── */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Course Details</h2>
                <p className="text-sm text-muted-foreground">In-depth breakdown of every course you manage</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleDownloadAll} className="gap-1.5 text-xs">
                <FileSpreadsheet className="w-3 h-3" /> Full Report
              </Button>
            </div>

            {data.map((d, ci) => {
              const students = d.analytics.students;
              const avg = students.length > 0
                ? Math.round(students.reduce((s, st) => s + st.progress, 0) / students.length)
                : 0;
              const done = students.filter((s) => s.progress === 100).length;
              const courseQuizzes = allQuizResults.filter((r) => r.courseId === d.course.id);
              const quizPassed = courseQuizzes.filter((r) => r.passed).length;
              const quizAvg = courseQuizzes.length > 0
                ? Math.round(courseQuizzes.reduce((s, r) => s + (r.score / r.total) * 100, 0) / courseQuizzes.length)
                : 0;
              const colorIdx = ci % CHART_PALETTE.length;

              return (
                <Card key={d.course.id} className="bg-card rounded-xl border border-border hover:border-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <CardTitle className="text-lg">{d.course.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px]">{d.course.category}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Created {d.course.created_at ? new Date(d.course.created_at).toLocaleDateString() : "—"}
                          </span>
                          {d.course.is_published ? (
                            <Badge className="text-[10px] bg-success/10 text-success border-success/20" variant="outline">Published</Badge>
                          ) : (
                            <Badge className="text-[10px] bg-warning/10 text-warning border-warning/20" variant="outline">Draft</Badge>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Course Stats Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {[
                        { label: "Modules", value: d.modules.length, icon: BookOpen },
                        { label: "Students", value: students.length, icon: Users },
                        { label: "Avg Progress", value: `${avg}%`, icon: TrendingUp },
                        { label: "Completed", value: done, icon: CheckCircle2 },
                        { label: "Quiz Attempts", value: courseQuizzes.length, icon: Target },
                        { label: "Quiz Avg", value: `${quizAvg}%`, icon: Award },
                      ].map((stat) => (
                        <div key={stat.label} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted border border-border">
                          <stat.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm font-bold text-foreground leading-tight">{stat.value}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Module List */}
                    {d.modules.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Modules</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {d.modules.sort((a, b) => a.order_index - b.order_index).map((m) => (
                            <div key={m.id} className="flex items-center gap-2 p-2 rounded-md bg-background border border-border hover:border-accent/50 transition-colors">
                              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {m.order_index + 1}
                              </span>
                              <span className="text-xs text-foreground truncate flex-1">{m.title}</span>
                              <Badge variant="outline" className={`text-[9px] px-1 py-0 ${m.status === "completed" ? "text-success border-success/30" : m.status === "processing" ? "text-warning border-warning/30" : "text-destructive border-destructive/30"}`}>
                                {m.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Student list for this course */}
                    {students.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Enrolled Students</p>
                        <div className="max-h-[200px] overflow-y-auto rounded-lg border border-border">
                          <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                              <tr className="border-b border-border">
                                <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Name</th>
                                <th className="text-left py-2 px-3 font-semibold text-muted-foreground">Email</th>
                                <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Progress</th>
                                <th className="text-center py-2 px-3 font-semibold text-muted-foreground">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.map((s, si) => {
                                const status = s.progress === 100 ? "Completed" : s.progress >= 75 ? "On Track" : s.progress >= 25 ? "In Progress" : "Needs Support";
                                const statusColor = s.progress === 100 ? "text-success" : s.progress >= 75 ? "text-accent" : s.progress >= 25 ? "text-warning" : "text-destructive";
                                return (
                                  <tr key={`${s.student_id}-${si}`} className="border-b border-border hover:bg-muted/30">
                                    <td className="py-2 px-3 font-medium text-foreground truncate max-w-[140px]">{s.name}</td>
                                    <td className="py-2 px-3 text-muted-foreground truncate max-w-[160px]">{s.email}</td>
                                    <td className="py-2 px-3">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <Progress value={s.progress} className="w-14 h-1.5" />
                                        <span className="font-semibold text-foreground w-8 text-right">{s.progress}%</span>
                                      </div>
                                    </td>
                                    <td className={`py-2 px-3 text-center font-medium ${statusColor}`}>{status}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Quiz summary for this course */}
                    {courseQuizzes.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Quiz Results</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-3 rounded-lg bg-success/5 border border-success/20 text-center">
                            <p className="text-lg font-bold text-success">{quizPassed}</p>
                            <p className="text-[10px] text-muted-foreground">Passed</p>
                          </div>
                          <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-center">
                            <p className="text-lg font-bold text-destructive">{courseQuizzes.length - quizPassed}</p>
                            <p className="text-[10px] text-muted-foreground">Failed</p>
                          </div>
                          <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-center">
                            <p className="text-lg font-bold text-accent">{quizAvg}%</p>
                            <p className="text-[10px] text-muted-foreground">Avg Score</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      )}
    </TrainerLayout>
  );
};

export default TrainerAnalytics;
