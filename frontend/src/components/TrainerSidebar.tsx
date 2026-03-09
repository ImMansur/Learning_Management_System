import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Users,
  BarChart3,
  Settings,
  Sparkles,
  LogOut,
  Zap,
  Megaphone,
} from "lucide-react";
import { useUser } from "@/context/UserContext";

const navItems = [
  { icon: BookOpen, label: "Dashboard", path: "/trainer/courses" },
  { icon: Plus, label: "Create Course", path: "/trainer/create-course" },
  { icon: Megaphone, label: "Community Posts", path: "/trainer/community" },
  { icon: Users, label: "Student Progress", path: "/trainer/students" },
  { icon: BarChart3, label: "Analytics", path: "/trainer/analytics" },
  { icon: Settings, label: "Settings", path: "/trainer/settings" },
];

export const TrainerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-primary flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">LTC Learn</h1>
            <p className="text-xs text-sidebar-muted">Trainer Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-glow"
                  : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-primary font-semibold text-sm">
              {user?.name ? (
                <>
                  {user.name.charAt(0).toUpperCase()}
                  {user.name.split(" ")[1]?.charAt(0).toUpperCase()}
                </>
              ) : (
                "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name || "User"}</p>
              <p className="text-xs text-sidebar-muted">{user?.role || "Trainer"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sidebar-muted hover:text-sidebar-foreground transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
