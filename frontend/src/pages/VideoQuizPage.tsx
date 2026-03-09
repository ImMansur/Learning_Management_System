import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { useUser } from "@/context/UserContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  HelpCircle,
  Loader2,
} from "lucide-react";

interface AIQuizQuestion {
  question_id: string;
  question: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  concept: string;
}

const VideoQuizPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();

  const [quizQuestions, setQuizQuestions] = useState<AIQuizQuestion[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoTitle, setVideoTitle] = useState("");

  const fetchQuiz = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const aiDocRef = doc(db, "ai_assets", videoId);
      const aiSnap = await getDoc(aiDocRef);
      if (aiSnap.exists()) {
        const data = aiSnap.data();
        if (data.questions && Array.isArray(data.questions)) {
          setQuizQuestions(data.questions);
        }
      }

      const videoDocRef = doc(db, "videos", videoId);
      const videoSnap = await getDoc(videoDocRef);
      if (videoSnap.exists()) {
        setVideoTitle(videoSnap.data().title || "");
      }
    } catch (err) {
      console.error("Failed to fetch quiz:", err);
    } finally {
      setLoading(false);
    }
  }, [videoId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  const quizAllAnswered = quizQuestions.every((q) => quizAnswers[q.question_id]);
  const quizPassed = quizSubmitted && quizScore === quizQuestions.length;

  const handleQuizSubmit = () => {
    let correct = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.question_id] === q.correct_answer) correct++;
    });
    setQuizScore(correct);
    setQuizSubmitted(true);
  };

  const handleQuizRetry = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
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

  if (quizQuestions.length === 0) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(`/video/${videoId}`)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to video
          </button>
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">No Quiz Available</p>
            <p className="text-muted-foreground">
              No quiz questions have been generated for this video yet.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/courses" className="hover:text-foreground transition-colors">Courses</Link>
          <span>/</span>
          <Link to={`/video/${videoId}`} className="hover:text-foreground transition-colors">
            {videoTitle || "Video"}
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">Quiz</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3 mb-2">
            <HelpCircle className="w-7 h-7 text-accent" />
            Knowledge Check
          </h1>
          <p className="text-muted-foreground">
            Test your understanding of{" "}
            <span className="font-medium text-foreground">{videoTitle || "this video"}</span>{" "}
            — {quizQuestions.length} questions
          </p>
        </div>

        {/* Score Banner (shown after submit) */}
        {quizSubmitted && (
          <div
            className={`rounded-xl border p-6 mb-6 text-center ${
              quizPassed
                ? "bg-success/10 border-success/30"
                : "bg-warning/10 border-warning/30"
            }`}
          >
            {quizPassed ? (
              <>
                <Trophy className="w-12 h-12 text-success mx-auto mb-3" />
                <p className="text-2xl font-bold text-foreground">
                  {quizScore}/{quizQuestions.length} — 100%!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Perfect score! You've mastered this content.
                </p>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-foreground">
                  {quizScore}/{quizQuestions.length} —{" "}
                  {Math.round((quizScore / quizQuestions.length) * 100)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Review the explanations below and try again!
                </p>
              </>
            )}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5">
          {quizQuestions.map((q, qi) => {
            const isCorrect =
              quizSubmitted && quizAnswers[q.question_id] === q.correct_answer;
            const isWrong =
              quizSubmitted &&
              quizAnswers[q.question_id] &&
              quizAnswers[q.question_id] !== q.correct_answer;
            return (
              <div
                key={q.question_id}
                className={`bg-card rounded-xl border p-6 ${
                  quizSubmitted
                    ? isCorrect
                      ? "border-success/50"
                      : isWrong
                      ? "border-destructive/50"
                      : "border-border"
                    : "border-border"
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-sm font-bold">
                    {qi + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-card-foreground leading-relaxed">
                      {q.question}
                    </p>
                    {q.concept && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Concept: {q.concept}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 ml-11">
                  {Object.entries(q.options).map(([key, text]) => {
                    const selected = quizAnswers[q.question_id] === key;
                    const showCorrect =
                      quizSubmitted && key === q.correct_answer;
                    const showWrong =
                      quizSubmitted && selected && key !== q.correct_answer;
                    return (
                      <button
                        key={key}
                        disabled={quizSubmitted}
                        onClick={() =>
                          setQuizAnswers((prev) => ({
                            ...prev,
                            [q.question_id]: key,
                          }))
                        }
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
                        <span
                          className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${
                            selected && !quizSubmitted
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-muted-foreground/30"
                          } ${
                            showCorrect
                              ? "border-success bg-success text-white"
                              : ""
                          } ${
                            showWrong
                              ? "border-destructive bg-destructive text-white"
                              : ""
                          }`}
                        >
                          {showCorrect ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : showWrong ? (
                            <XCircle className="w-4 h-4" />
                          ) : (
                            key
                          )}
                        </span>
                        {text}
                      </button>
                    );
                  })}
                </div>

                {quizSubmitted && q.explanation && (
                  <div className="mt-3 ml-11 p-3 rounded-lg bg-muted/50 border border-border">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Explanation:</span>{" "}
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => navigate(`/video/${videoId}`)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Video
          </button>

          {!quizSubmitted ? (
            <button
              onClick={handleQuizSubmit}
              disabled={!quizAllAnswered}
              className="px-8 py-3 rounded-xl bg-gradient-accent text-accent-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Quiz
            </button>
          ) : (
            <button
              onClick={handleQuizRetry}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card text-sm font-semibold text-card-foreground hover:bg-muted/50 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Retry Quiz
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default VideoQuizPage;
