import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { getVideos, VideoItem, chatWithCourse, getTTSStreamUrl } from "@/services/lmsApiService";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Brain,
  Loader2,
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  Volume2,
  Square,
} from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const VideoDetailPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  const [video, setVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploaderName, setUploaderName] = useState("");

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", content: "Hi! Ask me anything about this video's content." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // TTS state
  const [ttsLang, setTtsLang] = useState("en");
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchVideo = useCallback(async () => {
    if (!user || !videoId) return;
    setLoading(true);
    try {
      const token = await getToken();
      const videos = await getVideos(token);
      const found = videos.find((v) => v.id === videoId);
      setVideo(found || null);

      // Fetch uploader name
      if (found?.instructor_id) {
        try {
          const userDoc = await getDoc(doc(db, "users", found.instructor_id));
          if (userDoc.exists()) {
            setUploaderName(userDoc.data().name || "");
          }
        } catch (e) {
          console.error("Failed to fetch uploader name:", e);
        }
      }
    } catch (err) {
      console.error("Failed to fetch video:", err);
    } finally {
      setLoading(false);
    }
  }, [user, getToken, videoId]);

  // Fetch quiz from Firestore ai_assets
  const [hasQuiz, setHasQuiz] = useState(false);
  const fetchQuiz = useCallback(async () => {
    if (!videoId) return;
    try {
      const docRef = doc(db, "ai_assets", videoId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
          setHasQuiz(true);
        }
      }
    } catch (err) {
      console.error("Failed to check quiz:", err);
    }
  }, [videoId]);

  useEffect(() => {
    fetchVideo();
    fetchQuiz();
  }, [fetchVideo, fetchQuiz]);

  // Auto-refresh while processing
  useEffect(() => {
    if (!video || video.status !== "processing") return;
    const interval = setInterval(fetchVideo, 10000);
    return () => clearInterval(interval);
  }, [video, fetchVideo]);

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading || !videoId) return;
    const userMsg: Message = { id: messages.length + 1, role: "user", content: chatInput };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await chatWithCourse(videoId, chatInput);
      const botMsg: Message = { id: messages.length + 2, role: "assistant", content: res.answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errMsg: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: "Sorry, I couldn't process your question. Please try again.",
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  };


  const handlePlayTTS = () => {
    if (!videoId) return;
    const url = getTTSStreamUrl(videoId, ttsLang);
    const audio = new Audio(url);
    ttsAudioRef.current = audio;
    setTtsPlaying(true);
    audio.onended = () => { setTtsPlaying(false); ttsAudioRef.current = null; };
    audio.onerror = () => { setTtsPlaying(false); ttsAudioRef.current = null; };
    audio.play();
  };

  const handleStopTTS = () => {
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current.currentTime = 0;
      ttsAudioRef.current = null;
    }
    setTtsPlaying(false);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  if (!video) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Video not found.</p>
          <Link to="/courses" className="text-accent hover:underline text-sm mt-2 inline-block">
            Back to courses
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{video.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="relative bg-black aspect-video">
              <video src={video.video_url} controls className="w-full h-full">
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-6">
              <h1 className="text-xl font-bold text-card-foreground mb-1">{video.title}</h1>
              <p className="text-sm text-muted-foreground">
                {uploaderName && <span>Uploaded by <span className="font-medium text-foreground">{uploaderName}</span></span>}
                {uploaderName && video.created_at ? " · " : ""}
                {video.created_at ? new Date(video.created_at).toLocaleString() : ""}
              </p>
            </div>
          </div>

          {/* Transcript */}
          {video.status === "completed" && video.transcript && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent" /> Transcript
              </h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto pr-2">
                {video.transcript}
              </div>
            </div>
          )}

          {/* Processing indicator */}
          {video.status === "processing" && (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">AI is processing your video</h3>
              <p className="text-sm text-muted-foreground">
                Transcribing, summarizing, generating quiz, and building the knowledge base. This may take a few minutes...
              </p>
            </div>
          )}

          {/* Next: Take Quiz */}
          {video.status === "completed" && hasQuiz && (
            <div className="bg-card rounded-xl border border-border p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-semibold text-card-foreground">Ready to test your knowledge?</p>
                  <p className="text-sm text-muted-foreground">Take the AI-generated quiz for this video</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/video/${videoId}/quiz`)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Summary */}
          {video.status === "completed" && video.summary && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" /> AI Summary
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line max-h-[calc(100vh-20rem)] overflow-y-auto pr-2">
                {video.summary.split("**").map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i} className="text-card-foreground">{part}</strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )}
              </div>

              {/* TTS */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs font-medium text-foreground mb-2">Listen to Summary</p>
                <div className="flex gap-2">
                  <select
                    value={ttsLang}
                    onChange={(e) => setTtsLang(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                    <option value="ja">Japanese</option>
                    <option value="ar">Arabic</option>
                    <option value="zh-Hans">Chinese</option>
                  </select>
                  {ttsPlaying ? (
                    <button
                      onClick={handleStopTTS}
                      className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Square className="w-3.5 h-3.5" /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={handlePlayTTS}
                      className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Play
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── FLOATING CHATBOT ───────────────────────────────────── */}
      {video.status === "completed" && (
        <>
          <button
            onClick={() => setChatOpen((o) => !o)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-accent text-accent-foreground shadow-lg hover:opacity-90 transition-all flex items-center justify-center"
          >
            {chatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
          </button>

          {chatOpen && (
            <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 h-[28rem] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-border bg-gradient-primary flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                  <Bot className="w-4 h-4 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary-foreground">Video Assistant</p>
                  <p className="text-[10px] text-primary-foreground/60">RAG-powered Q&A</p>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-primary-foreground/60 hover:text-primary-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        msg.role === "assistant" ? "bg-accent/10 text-accent" : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {msg.role === "assistant" ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    </div>
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "assistant" ? "bg-muted text-foreground" : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-md bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="bg-muted rounded-xl px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-3 py-3 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                    placeholder="Ask about this video..."
                    className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30"
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={chatLoading}
                    className="rounded-lg bg-gradient-accent hover:opacity-90 text-accent-foreground px-3 py-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AppLayout>
  );
};

export default VideoDetailPage;
