import AdminLayout from "@/components/AdminLayout";
import { users } from "@/data/users";
import { trainerCourses } from "@/data/trainer";
import { StatCard } from "@/components/StatCard";
import { Users, BookOpen, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminDashboard = () => {
  const totalUsers = users.length;
  const totalCourses = trainerCourses.length;
  const totalTrainers = users.filter((u) => u.role === "Trainer").length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-1">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">Manage users, courses, trainers and monitor AI usage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total Users" value={`${totalUsers}`} subtitle="Registered on the platform" icon={<Users />} />
        <StatCard title="Total Courses" value={`${totalCourses}`} subtitle="Active and draft courses" icon={<BookOpen />} />
        <StatCard title="Total Trainers" value={`${totalTrainers}`} subtitle="Users with trainer role" icon={<UserPlus />} />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          <Button variant="outline" onClick={() => (location.href = "/admin/users")}>Manage Users</Button>
          <Button variant="outline" onClick={() => (location.href = "/admin/courses")}>Manage Courses</Button>
          <Button variant="outline" onClick={() => (location.href = "/admin/analytics")}>View Analytics</Button>
          <Button variant="outline" onClick={() => (location.href = "/admin/ai")}>AI Monitor</Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
