import AppLayout from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { CourseCard } from "@/components/CourseCard";
import { getAllCourses, Course } from "@/data/courses";
import {
  BookOpen,
  Brain,
  TrendingUp,
  Clock,
  ArrowRight,
  Sparkles,
  Flame,
  Target,
  PlayCircle,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { useEffect, useState, useMemo } from "react";

const Dashboard = () => {
  const location = useLocation();
  const { user } = useUser();
  const firstName = user?.name.split(" ")[0] || "User";
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    setCourses(getAllCourses());
  }, [location.key]);

  /* ---- Derived stats from real course data ---- */
  const stats = useMemo(() => {
    const allLessons = courses.flatMap((c) => c.modules.flatMap((m) => m.lessons));
    const completedLessons = allLessons.filter((l) => l.completed).length;
    const totalLessons = allLessons.length;
    const inProgress = courses.filter((c) => {
      const done = c.modules.flatMap((m) => m.lessons).filter((l) => l.completed).length;
      const total = c.modules.flatMap((m) => m.lessons).length;
      return done > 0 && done < total;
    }).length;
    const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { completedLessons, totalLessons, inProgress, enrolled: courses.length, overallPct };
  }, [courses]);

  /* ---- Find the course with the most recent progress for "Continue" ---- */
  const continueCourse = useMemo(() => {
    return courses.find((c) => {
      const done = c.modules.flatMap((m) => m.lessons).filter((l) => l.completed).length;
      const total = c.modules.flatMap((m) => m.lessons).length;
      return done > 0 && done < total;
    });
  }, [courses]);

  /* ---- Greeting based on time of day ---- */
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <AppLayout>
      {/* ===== Hero Section ===== */}
      <div className="relative rounded-2xl overflow-hidden mb-8">
        <div className="bg-primary px-8 py-10 md:px-10 relative">
          {/* Decorative shapes */}
          <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full bg-accent blur-3xl" />
            <div className="absolute bottom-0 left-1/3 w-96 h-40 rounded-full bg-primary-foreground blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 max-w-lg">
              <p className="text-primary-foreground/60 text-sm font-medium">{greeting},</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-primary-foreground leading-tight">
                {firstName} 👋
              </h1>
              <p className="text-primary-foreground/70 text-base">
                {stats.inProgress > 0
                  ? `You have ${stats.inProgress} course${stats.inProgress > 1 ? "s" : ""} in progress. Keep the momentum going!`
                  : "Start a new course today and begin your learning journey."}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                {continueCourse ? (
                  <Link
                    to={`/courses/${continueCourse.id}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <PlayCircle className="w-4 h-4" /> Continue Learning
                  </Link>
                ) : (
                  <Link
                    to="/courses"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    <BookOpen className="w-4 h-4" /> Browse Courses
                  </Link>
                )}
                <Link
                  to="/assistant"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 text-sm font-semibold hover:bg-primary-foreground/20 transition-colors"
                >
                  <Sparkles className="w-4 h-4" /> AI Assistant
                </Link>
              </div>
            </div>

            {/* Mini progress ring */}
            <div className="hidden md:flex flex-col items-center gap-2">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-primary-foreground/10"
                  />
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${stats.overallPct} ${100 - stats.overallPct}`}
                    strokeLinecap="round"
                    className="text-accent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-primary-foreground">{stats.overallPct}%</span>
                  <span className="text-[10px] text-primary-foreground/60 font-medium">Overall</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Stat Cards ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Courses Enrolled"
          value={String(stats.enrolled)}
          subtitle={`${stats.inProgress} in progress`}
          icon={<BookOpen className="w-6 h-6" />}
        />
        <StatCard
          title="Lessons Completed"
          value={String(stats.completedLessons)}
          subtitle={`Out of ${stats.totalLessons} total`}
          icon={<TrendingUp className="w-6 h-6" />}
          progress={stats.totalLessons > 0 ? Math.round((stats.completedLessons / stats.totalLessons) * 100) : 0}
        />
        <StatCard
          title="Learning Streak"
          value="7 days"
          subtitle="Keep it going!"
          icon={<Flame className="w-6 h-6" />}
        />
        <StatCard
          title="Achievements"
          value="3"
          subtitle="1 new this week"
          icon={<Target className="w-6 h-6" />}
        />
      </div>

      {/* ===== Quick Actions ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "My Courses", icon: BookOpen, to: "/courses", color: "bg-accent/10 text-accent" },
          { label: "AI Assistant", icon: Brain, to: "/assistant", color: "bg-info/10 text-info" },
          { label: "Progress", icon: TrendingUp, to: "/progress", color: "bg-success/10 text-success" },
          { label: "Study Time", icon: Clock, to: "/progress", color: "bg-warning/10 text-warning" },
        ].map((action) => (
          <Link
            key={action.label}
            to={action.to}
            className="flex flex-col items-center gap-2 bg-card rounded-xl border border-border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}>
              <action.icon className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-card-foreground">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* ===== Continue Learning ===== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">Continue Learning</h2>
          <Link
            to="/courses"
            className="inline-flex items-center gap-1 text-sm text-accent font-medium hover:underline"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.slice(0, 3).map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
      </div>

      {/* ===== Recent Activity ===== */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-5">Recent Activity</h2>
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {[
            { action: "Completed lesson", detail: "What is Artificial Intelligence?", time: "2 hours ago", icon: BookOpen, color: "bg-success/10 text-success" },
            { action: "AI Summary generated", detail: "Deep Learning Module Overview", time: "5 hours ago", icon: Brain, color: "bg-accent/10 text-accent" },
            { action: "Started course", detail: "Cloud Computing & Infrastructure", time: "1 day ago", icon: Sparkles, color: "bg-info/10 text-info" },
            { action: "Quiz completed", detail: "ML Fundamentals — Score: 85%", time: "2 days ago", icon: Target, color: "bg-warning/10 text-warning" },
          ].map((activity, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                <activity.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground">{activity.action}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.detail}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
