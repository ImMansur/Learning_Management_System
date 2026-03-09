import { useState, useEffect } from "react";
import TrainerLayout from "@/components/TrainerLayout";
import { getMyCourses, notifyLearners, BackendCourse } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import {
  Send,
  Megaphone,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";

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

function savePosts(posts: CommunityPost[]) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

const CommunityPosts = () => {
  const { user, getToken } = useUser();
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [posts, setPosts] = useState<CommunityPost[]>(loadPosts);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const token = await getToken();
        const data = await getMyCourses(token);
        setCourses(data);
        if (data.length > 0) setSelectedCourseId(data[0].id);
      } catch (err) {
        console.error("Failed to load courses:", err);
      } finally {
        setLoadingCourses(false);
      }
    };
    fetch();
  }, [user, getToken]);

  const handleSend = async () => {
    if (!selectedCourseId || !subject.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    setSending(true);
    try {
      const token = await getToken();
      await notifyLearners(token, selectedCourseId, subject.trim(), message.trim());

      const course = courses.find((c) => c.id === selectedCourseId);
      const newPost: CommunityPost = {
        id: crypto.randomUUID(),
        courseId: selectedCourseId,
        courseTitle: course?.title || "Unknown Course",
        subject: subject.trim(),
        message: message.trim(),
        author: user?.name || "Trainer",
        timestamp: new Date().toISOString(),
      };
      const updated = [newPost, ...posts];
      setPosts(updated);
      savePosts(updated);

      setSubject("");
      setMessage("");
      toast.success("Update sent and emails delivered!");
    } catch (err: any) {
      toast.error("Failed to send: " + (err.message || "Unknown error"));
    } finally {
      setSending(false);
    }
  };

  const myPosts = posts.filter((p) =>
    courses.some((c) => c.id === p.courseId)
  );

  return (
    <TrainerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Megaphone className="w-8 h-8 text-accent" /> Community Posts
        </h1>
        <p className="text-muted-foreground">
          Send updates to your enrolled learners. Posts are also sent as emails.
        </p>
      </div>

      {/* Compose */}
      <div className="bg-card rounded-xl border border-border p-6 mb-8">
        <h2 className="text-lg font-semibold text-card-foreground mb-4">New Update</h2>

        {loadingCourses ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading courses...
          </div>
        ) : courses.length === 0 ? (
          <p className="text-muted-foreground py-4">
            You have no courses yet. Create a course first.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Course selector */}
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">
                Course
              </label>
              <div className="relative">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New module added!"
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium text-card-foreground mb-1.5 block">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your update here..."
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 resize-none"
              />
            </div>

            <button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !message.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {sending ? "Sending..." : "Send Update & Email"}
            </button>
          </div>
        )}
      </div>

      {/* Sent posts */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Sent Updates</h2>
        {myPosts.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Megaphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No updates sent yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myPosts.map((post) => (
              <div key={post.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-card-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {post.subject}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {post.courseTitle} &bull; {new Date(post.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line mt-2">
                  {post.message}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </TrainerLayout>
  );
};

export default CommunityPosts;
