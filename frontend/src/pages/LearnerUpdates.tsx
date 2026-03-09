import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { getMyProfile } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { Megaphone, Loader2, BookOpen, Clock, ArrowRight } from "lucide-react";

interface CommunityPost {
  id: string;
  courseId: string;
  courseTitle: string;
  subject: string;
  message: string;
  author: string;
  timestamp: string;
}

const POSTS_KEY = "lms_community_posts";

function loadPosts(): CommunityPost[] {
  try {
    return JSON.parse(localStorage.getItem(POSTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-indigo-600",
    "bg-cyan-600", "bg-teal-600", "bg-sky-600", "bg-purple-600",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const LearnerUpdates = () => {
  const { user, getToken } = useUser();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const profile = await getMyProfile(token).catch(() => null);
        const enrolled = new Set(Object.keys(profile?.enrollments || {}));
        setEnrolledCourseIds(enrolled);
        setPosts(loadPosts());
      } catch (err) {
        console.error("Failed to load updates:", err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [user, getToken]);

  const visiblePosts = posts.filter((p) => enrolledCourseIds.has(p.courseId));

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
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-accent" /> Community Updates
        </h1>
        <p className="text-muted-foreground">
          Latest announcements from your course trainers.
        </p>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border border-border">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground text-lg font-semibold">No updates yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            When your trainers post announcements, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl">
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className="bg-card rounded-xl border border-border overflow-hidden"
            >
              {/* Post header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                <div
                  className={`w-10 h-10 rounded-full ${avatarColor(post.author)} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white text-sm font-bold">{getInitials(post.author)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground text-sm truncate">{post.author}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link
                      to={`/courses/${post.courseId}`}
                      className="inline-flex items-center gap-1 hover:text-accent transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      {post.courseTitle}
                    </Link>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(post.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post body */}
              <div className="px-5 pb-5">
                <h3 className="font-semibold text-card-foreground text-base mb-1.5">{post.subject}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {post.message}
                </p>
                <Link
                  to={`/courses/${post.courseId}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-accent hover:opacity-80 transition-opacity"
                >
                  Go to course <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default LearnerUpdates;
