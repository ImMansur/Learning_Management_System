import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import {
  getMyProfile,
  getCommunityPosts,
  addCommunityComment,
  toggleReaction,
  CommunityPost,
} from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import {
  Megaphone,
  Loader2,
  BookOpen,
  Clock,
  ArrowRight,
  MessageCircle,
  Send,
  SmilePlus,
  Users,
} from "lucide-react";

const REACTION_EMOJIS = ["👍", "❤️", "🎉", "🔥", "💡", "👏"];

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
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentingOn, setCommentingOn] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const [profile, postData] = await Promise.all([
          getMyProfile(token).catch(() => null),
          getCommunityPosts(token),
        ]);
        const enrolled = new Set(Object.keys(profile?.enrollments || {}));
        setEnrolledCourseIds(enrolled);
        setPosts(postData);
      } catch (err) {
        console.error("Failed to load updates:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, getToken]);

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    setCommentingOn(postId);
    try {
      const token = await getToken();
      const comment = await addCommunityComment(token, postId, content);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
        )
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch {
      // silently fail
    } finally {
      setCommentingOn(null);
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    setShowEmojiPicker(null);
    try {
      const token = await getToken();
      const { reactions } = await toggleReaction(token, postId, emoji);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, reactions } : p))
      );
    } catch {
      // silently fail
    }
  };

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      next.has(postId) ? next.delete(postId) : next.add(postId);
      return next;
    });
  };

  const visiblePosts = posts.filter((p) => enrolledCourseIds.has(p.course_id));

  const totalReactions = (r: Record<string, string[]>) =>
    Object.values(r || {}).reduce((sum, arr) => sum + arr.length, 0);

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 rounded-xl bg-accent/10">
            <Megaphone className="w-7 h-7 text-accent" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Community Updates</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Latest announcements from your course trainers.
            </p>
          </div>
        </div>
        {/* Summary */}
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
            <Megaphone className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-card-foreground">{visiblePosts.length} Updates</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
            <MessageCircle className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-card-foreground">
              {visiblePosts.reduce((s, p) => s + p.comments.length, 0)} Comments
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
            <BookOpen className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-card-foreground">{enrolledCourseIds.size} Enrolled</span>
          </div>
        </div>
      </div>

      {visiblePosts.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-xl border-2 border-dashed border-border">
          <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-foreground text-lg font-semibold">No updates yet</p>
          <p className="text-muted-foreground text-sm mt-1">
            When your trainers post announcements, they will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-5 max-w-3xl">
          {visiblePosts.map((post) => (
            <div
              key={post.id}
              className="bg-card rounded-xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Post header */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                <div
                  className={`w-10 h-10 rounded-full ${avatarColor(post.author_username)} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white text-sm font-bold">{getInitials(post.author_username)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground text-sm truncate">{post.author_username}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Link
                      to={`/courses/${post.course_id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      {post.course_title}
                    </Link>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(post.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post body */}
              <div className="px-5 pb-3">
                <h3 className="font-semibold text-card-foreground text-base mb-1.5">{post.subject}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {post.message}
                </p>
                <Link
                  to={`/courses/${post.course_id}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-accent hover:opacity-80 transition-opacity"
                >
                  Go to course <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Reactions bar */}
              <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
                {Object.entries(post.reactions || {}).map(([emoji, uids]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(post.id, emoji)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                      uids.includes(user?.uid || "")
                        ? "bg-accent/15 border-accent/40 text-accent"
                        : "bg-muted/50 border-border text-muted-foreground hover:border-accent/30"
                    }`}
                  >
                    <span className="text-sm">{emoji}</span> {uids.length}
                  </button>
                ))}
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(showEmojiPicker === post.id ? null : post.id)}
                    className="p-1.5 rounded-full text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors"
                    title="Add reaction"
                  >
                    <SmilePlus className="w-4 h-4" />
                  </button>
                  {showEmojiPicker === post.id && (
                    <div className="absolute left-0 top-full mt-1 z-20 flex gap-1 p-2 bg-card border border-border rounded-xl shadow-lg">
                      {REACTION_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(post.id, emoji)}
                          className="text-lg hover:scale-125 transition-transform p-1 rounded hover:bg-muted/50"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="px-5 py-2.5 border-t border-border flex items-center gap-4">
                <button
                  onClick={() => toggleComments(post.id)}
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-accent transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  {post.comments.length > 0 ? `${post.comments.length} Comments` : "Comment"}
                </button>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {totalReactions(post.reactions)} Reactions
                </span>
              </div>

              {/* Comments section (expandable) */}
              {expandedComments.has(post.id) && (
                <div className="border-t border-border bg-muted/30">
                  {post.comments.length > 0 && (
                    <div className="px-5 pt-4 pb-2 space-y-3">
                      {post.comments.map((c, idx) => (
                        <div key={idx} className="flex gap-3">
                          <div className={`w-7 h-7 rounded-full ${avatarColor(c.author_username)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-[10px] font-bold">{getInitials(c.author_username)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium text-card-foreground text-sm">{c.author_username}</span>
                              <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-5 py-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Write a comment..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) =>
                        setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      disabled={commentingOn === post.id || !commentInputs[post.id]?.trim()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {commentingOn === post.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
};

export default LearnerUpdates;
