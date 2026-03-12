import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import AppLayout from "@/components/AppLayout";
import {
  getModuleAIAssets,
  getCourseModules,
  getCourseCatalog,
  completeModule,
  submitQuizResult,
  getMyProfile,
  AIQuizQuestion,
  BackendModule,
} from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { markQuizPassed } from "@/services/quizService";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  RotateCcw,
  Loader2,
} from "lucide-react";

const ModuleQuiz = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, getToken } = useUser();

  const [loading, setLoading] = useState(true);
  const [courseTitle, setCourseTitle] = useState("");
  const [moduleTitle, setModuleTitle] = useState("");
  const [questions, setQuestions] = useState<AIQuizQuestion[]>([]);
  const [modules, setModules] = useState<BackendModule[]>([]);
  const [error, setError] = useState("");

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!courseId || !moduleId || !user) return;
      setLoading(true);
      setError("");
      try {
        const token = await getToken();
        const [catalog, mods, assets] = await Promise.all([
          getCourseCatalog(token),
          getCourseModules(token, courseId),
          getModuleAIAssets(moduleId),
        ]);

        const course = catalog.find((c) => c.id === courseId);
        setCourseTitle(course?.title || "Course");
        setModules(mods);

        // Lock check: redirect if previous module not completed
        const idx = mods.findIndex((m) => m.id === moduleId);
        if (idx > 0) {
          const profileData = await getMyProfile(token).catch(() => null);
          const completed = new Set(profileData?.enrollments?.[courseId!]?.completed_modules || []);
          if (!completed.has(mods[idx - 1].id)) {
            toast.error("Complete the previous module first.");
            navigate(`/courses/${courseId}`, { replace: true });
            return;
          }
        }

        const mod = mods.find((m) => m.id === moduleId);
        setModuleTitle(mod?.title || "Module");

        if (assets.questions && assets.questions.length > 0) {
          setQuestions(assets.questions);
        } else {
          setError("No quiz questions available yet. AI may still be processing.");
        }
      } catch (err) {
        console.error("Failed to load quiz:", err);
        setError("Failed to load quiz data.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
    // Reset quiz state when route changes
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [courseId, moduleId, user, getToken]);

  const moduleIndex = modules.findIndex((m) => m.id === moduleId);
  const nextModule = moduleIndex >= 0 && moduleIndex < modules.length - 1 ? modules[moduleIndex + 1] : null;

  const handleSelect = (questionIdx: number, optionIdx: number) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmit = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) correct++;
    });
    setScore(correct);
    setSubmitted(true);

    const isPassed = correct === questions.length;

    // Save quiz result to backend and always save locally for analytics
    if (courseId && moduleId && user) {
      const quizAttempt = {
        id: `${user.uid}_${courseId}_${moduleId}_${Date.now()}`,
        student_id: user.uid,
        student_name: user.displayName || user.email || "Anonymous",
        student_email: user.email || "",
        module_id: moduleId,
        course_id: courseId,
        score: correct,
        total: questions.length,
        passed: isPassed,
        attempted_at: new Date().toISOString(),
      };
      // Save to backend
      try {
        const token = await getToken();
        await submitQuizResult(token, courseId, moduleId, {
          score: correct,
          total: questions.length,
          passed: isPassed,
        });
      } catch (err) {
        console.error("Failed to save quiz result:", err);
      }

    }

    // If passed (100%), mark module as complete and record quiz pass
    if (isPassed && courseId && moduleId && user) {
      markQuizPassed(courseId, moduleId);
      try {
        const token = await getToken();
        await completeModule(token, courseId, moduleId);
      } catch (err) {
        console.error("Failed to mark module complete:", err);
      }
      // Fire confetti celebration
      fireConfetti();
    }
  };

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    // Big initial burst
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors });
    frame();
  }, []);

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const passed = submitted && score === questions.length;
  const allAnswered = questions.every((_, idx) => answers[idx] !== undefined);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to={`/courses/${courseId}`} className="text-accent hover:underline text-sm">
            Back to course
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
        <ChevronRight className="w-3 h-3" />
        <Link to={`/courses/${courseId}`} className="hover:text-foreground transition-colors">{courseTitle}</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-foreground font-medium">{moduleTitle} – Quiz</span>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h1 className="text-xl font-bold text-card-foreground mb-1">
            Module Quiz: {moduleTitle}
          </h1>
          <p className="text-sm text-muted-foreground">
            You must score <strong className="text-foreground">100%</strong> to unlock the next module. {questions.length} questions.
          </p>
        </div>

        {/* Questions */}
        {questions.map((q, qi) => {
          const selectedIdx = answers[qi];
          const correctIdx = q.correctIndex;
          const isCorrect = submitted && selectedIdx === correctIdx;
          const isWrong = submitted && selectedIdx !== undefined && selectedIdx !== correctIdx;

          return (
            <div
              key={qi}
              className={`bg-card rounded-xl border p-6 transition-colors ${
                submitted
                  ? isCorrect
                    ? "border-success/50"
                    : isWrong
                    ? "border-destructive/50"
                    : "border-border"
                  : "border-border"
              }`}
            >
              <p className="font-medium text-card-foreground mb-4">
                {qi + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const selected = selectedIdx === oi;
                  const showCorrect = submitted && oi === correctIdx;
                  const showWrong = submitted && selected && oi !== correctIdx;
                  return (
                    <button
                      key={oi}
                      onClick={() => handleSelect(qi, oi)}
                      disabled={submitted}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex items-center gap-3 ${
                        showCorrect
                          ? "border-success bg-success/10 text-success font-medium"
                          : showWrong
                          ? "border-destructive bg-destructive/10 text-destructive font-medium"
                          : selected
                          ? "border-accent bg-accent/10 text-accent font-medium"
                          : "border-border hover:border-accent/50 text-card-foreground"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${
                        selected && !submitted ? "border-accent bg-accent text-accent-foreground" : "border-muted-foreground/30"
                      } ${showCorrect ? "border-success bg-success text-white" : ""} ${showWrong ? "border-destructive bg-destructive text-white" : ""}`}>
                        {showCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : showWrong ? <XCircle className="w-3.5 h-3.5" /> : String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Result / Actions */}
        <div className="bg-card rounded-xl border border-border p-6">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="w-full py-3 rounded-xl bg-gradient-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Quiz
            </button>
          ) : passed ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-success" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-card-foreground">
                  Congratulations! {score}/{questions.length} — 100%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  You passed the quiz. {nextModule ? "The next module is now unlocked." : "You completed all modules in this course!"}
                </p>
              </div>
              {nextModule ? (
                <Link
                  to={`/courses/${courseId}/lesson/${nextModule.id}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  Start {nextModule.title} <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <p className="text-sm font-semibold text-success">🎉 Course Completed!</p>
                  <p className="text-xs text-muted-foreground">
                    Your course certificate will be sent to your email shortly.
                  </p>
                  <button
                    onClick={() => navigate("/courses")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                  >
                    Browse Courses <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-destructive" />
                </div>
              </div>
              <div>
                <p className="text-lg font-bold text-card-foreground">
                  {score}/{questions.length} — {Math.round((score / questions.length) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  You need 100% to pass. Review the incorrect answers above and try again.
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-card text-sm font-semibold text-card-foreground hover:bg-muted/50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Retry Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ModuleQuiz;
