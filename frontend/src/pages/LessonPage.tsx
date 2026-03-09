import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { LessonChatBot } from "@/components/LessonChatBot";
import {
  getCourseCatalog,
  getCourseModules,
  getModuleAIAssets,
  getTTSStreamUrl,
  BackendCourse,
  BackendModule,
  ModuleAIAssets,
} from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { isQuizPassed } from "@/services/quizService";
import {
  ArrowLeft,
  PlayCircle,
  FileText,
  CheckCircle2,
  Circle,
  Brain,
  ChevronRight,
  Loader2,
  Volume2,
  Square,
  Lock,
} from "lucide-react";

const LessonPage = () => {
  const { courseId, lessonId: moduleId } = useParams();
  const { user, getToken } = useUser();

  const [course, setCourse] = useState<BackendCourse | null>(null);
  const [modules, setModules] = useState<BackendModule[]>([]);
  const [currentModule, setCurrentModule] = useState<BackendModule | null>(null);
  const [aiAssets, setAiAssets] = useState<ModuleAIAssets | null>(null);
  const [loading, setLoading] = useState(true);
  const [ttsLang, setTtsLang] = useState("en");
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [moduleId]);

  useEffect(() => {
    if (!user || !courseId || !moduleId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const [catalogData, modulesData] = await Promise.all([
          getCourseCatalog(token),
          getCourseModules(token, courseId),
        ]);
        const foundCourse = catalogData.find((c) => c.id === courseId) || null;
        setCourse(foundCourse);
        setModules(modulesData);
        const found = modulesData.find((m) => m.id === moduleId) || null;
        setCurrentModule(found);

        if (found) {
          const assets = await getModuleAIAssets(found.id).catch(() => null);
          setAiAssets(assets);
        }
      } catch (err) {
        console.error("Failed to fetch lesson data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, moduleId, user, getToken]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Course not found.</p>
          <Link to="/courses" className="text-accent hover:underline text-sm mt-2 inline-block">
            Back to courses
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (!currentModule) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Lesson not found.</p>
          <Link to={`/courses/${courseId}`} className="text-accent hover:underline text-sm mt-2 inline-block">
            Back to course
          </Link>
        </div>
      </AppLayout>
    );
  }

  const currentIdx = modules.findIndex((m) => m.id === moduleId);
  const prevModule = currentIdx > 0 ? modules[currentIdx - 1] : null;
  const nextModule = currentIdx < modules.length - 1 ? modules[currentIdx + 1] : null;
  const currentQuizPassed = courseId && moduleId ? isQuizPassed(courseId, moduleId) : false;

  const ttsLanguages = [
    { code: "en", label: "English" },
    { code: "es", label: "Spanish" },
    { code: "fr", label: "French" },
    { code: "de", label: "German" },
    { code: "hi", label: "Hindi" },
    { code: "ar", label: "Arabic" },
    { code: "zh", label: "Chinese" },
  ];

  return (
    <AppLayout>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
        <ChevronRight className="w-3 h-3" />
        <Link to={`/courses/${courseId}`} className="hover:text-foreground transition-colors">{course.title}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{currentModule.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="relative bg-black aspect-video">
              {currentModule.video_blob_url ? (
                <video
                  src={currentModule.video_blob_url}
                  controls
                  className="w-full h-full"
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Video not available</p>
                </div>
              )}
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <PlayCircle className="w-5 h-5 text-accent" />
                <span className="text-xs text-muted-foreground uppercase font-semibold">Video</span>
                {currentModule.status === "completed" && (
                  <span className="flex items-center gap-1 text-xs text-success font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-card-foreground">{currentModule.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{course.title}</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" /> Transcript
            </h2>
            <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line max-h-80 overflow-y-auto pr-2">
              {aiAssets?.transcript_text || (
                <span className="italic">
                  {currentModule.status === "processing"
                    ? "AI is still processing the transcript..."
                    : "Transcript not available."}
                </span>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <Link
                to={`/courses/${courseId}/quiz/${currentModule.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Brain className="w-4 h-4" /> Take Quiz
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {prevModule ? (
              <Link
                to={`/courses/${courseId}/lesson/${prevModule.id}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-card-foreground hover:bg-muted/50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {prevModule.title}
              </Link>
            ) : <div />}
            {nextModule ? (
              currentQuizPassed ? (
                <Link
                  to={`/courses/${courseId}/lesson/${nextModule.id}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {nextModule.title} <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <span className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-muted/50 text-sm font-medium text-muted-foreground cursor-not-allowed" title="Pass the quiz to unlock the next module">
                  <Lock className="w-4 h-4" /> {nextModule.title}
                </span>
              )
            ) : <div />}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-card-foreground mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent" /> AI Summary
            </h2>
            <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line max-h-[calc(100vh-16rem)] overflow-y-auto pr-2">
              {aiAssets?.summary_markdown ? (
                aiAssets.summary_markdown.split("**").map((part, i) =>
                  i % 2 === 1 ? (
                    <strong key={i} className="text-card-foreground">{part}</strong>
                  ) : (
                    <span key={i}>{part}</span>
                  )
                )
              ) : (
                <span className="italic">
                  {currentModule.status === "processing"
                    ? "AI is generating the summary..."
                    : "Summary not available."}
                </span>
              )}
            </div>

            {/* Compact TTS */}
            {aiAssets?.summary_markdown && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-accent flex-shrink-0" />
                  <select
                    value={ttsLang}
                    onChange={(e) => {
                      setTtsLang(e.target.value);
                      if (audioRef.current) {
                        audioRef.current.pause();
                        setTtsPlaying(false);
                      }
                    }}
                    className="flex-1 bg-muted text-foreground text-xs rounded-lg px-2 py-1.5 border border-border outline-none focus:ring-1 focus:ring-accent/30"
                  >
                    {ttsLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (!audioRef.current) {
                        const audio = new Audio(getTTSStreamUrl(currentModule!.id, ttsLang));
                        audio.onended = () => setTtsPlaying(false);
                        audio.onerror = () => setTtsPlaying(false);
                        audioRef.current = audio;
                      } else if (audioRef.current.src !== getTTSStreamUrl(currentModule!.id, ttsLang)) {
                        audioRef.current.pause();
                        audioRef.current = new Audio(getTTSStreamUrl(currentModule!.id, ttsLang));
                        audioRef.current.onended = () => setTtsPlaying(false);
                        audioRef.current.onerror = () => setTtsPlaying(false);
                      }
                      if (ttsPlaying) {
                        audioRef.current.pause();
                        audioRef.current.currentTime = 0;
                        setTtsPlaying(false);
                      } else {
                        audioRef.current.play();
                        setTtsPlaying(true);
                      }
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      ttsPlaying
                        ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        : "bg-accent/10 text-accent hover:bg-accent/20"
                    }`}
                  >
                    {ttsPlaying ? <Square className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="font-semibold text-card-foreground text-sm">Course Modules</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {modules.filter((m) => m.status === "completed").length}/{modules.length} completed
              </p>
            </div>
            <div className="divide-y divide-border">
              {modules.map((mod, idx) => {
                const isActive = mod.id === moduleId;
                // A module is accessible if it's the first, already completed, or all previous modules have passed quizzes
                const isAccessible = idx === 0 || mod.status === "completed" || modules.slice(0, idx).every((prev) => courseId && isQuizPassed(courseId, prev.id));
                if (!isAccessible) {
                  return (
                    <div
                      key={mod.id}
                      className="flex items-center gap-3 px-6 py-3 text-sm text-muted-foreground/50 cursor-not-allowed"
                      title="Pass previous quizzes to unlock"
                    >
                      <Lock className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{mod.title}</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={mod.id}
                    to={`/courses/${courseId}/lesson/${mod.id}`}
                    className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                      isActive ? "bg-accent/10 text-accent font-medium" : "hover:bg-muted/50 text-card-foreground"
                    }`}
                  >
                    {mod.status === "completed" ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : isActive ? (
                      <PlayCircle className="w-4 h-4 text-accent flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="flex-1 truncate">{mod.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <LessonChatBot courseId={courseId} />
    </AppLayout>
  );
};

export default LessonPage;
