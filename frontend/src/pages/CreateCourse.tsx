import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TrainerLayout from "@/components/TrainerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Brain,
  Video,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createCourse, uploadModule } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";

type Step = "info" | "modules" | "processing" | "complete";

interface ModuleForm {
  title: string;
  file?: File;
  uploadStatus?: "pending" | "uploading" | "done" | "error";
  moduleId?: string;
  error?: string;
}

const CreateCourse = () => {
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);

  // Step 1: Course Info
  const [courseTitle, setCourseTitle] = useState("");
  const [courseCategory, setCourseCategory] = useState("");

  // Step 2: Modules (each module = one video)
  const [modules, setModules] = useState<ModuleForm[]>([{ title: "" }]);

  // Processing
  const [processingStatus, setProcessingStatus] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

  const categories = [
    "AI / ML",
    "Data",
    "Cloud",
    "DevOps",
    "Web Development",
    "Mobile Development",
    "GenAi",
  ];

  const addModule = () => {
    setModules([...modules, { title: "" }]);
  };

  const removeModule = (index: number) => {
    if (modules.length === 1) {
      toast.error("Course must have at least one module");
      return;
    }
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, updates: Partial<ModuleForm>) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], ...updates };
    setModules(updated);
  };

  const validateStep = (): boolean => {
    if (step === "info") {
      if (!courseTitle.trim() || !courseCategory) {
        toast.error("Please fill in all required fields");
        return false;
      }
      return true;
    }
    if (step === "modules") {
      if (modules.some((m) => !m.title.trim())) {
        toast.error("All modules must have a title");
        return false;
      }
      const hasVideo = modules.some((m) => m.file);
      if (!hasVideo) {
        toast.error("At least one module must have a video file");
        return false;
      }
      return true;
    }
    return true;
  };

  const handleCreateAndUpload = async () => {
    if (!validateStep() || !user) return;

    setLoading(true);
    setStep("processing");
    setProcessingProgress(0);

    try {
      const token = await getToken();

      // 1. Create the course
      setProcessingStatus("Creating course...");
      const { course_id } = await createCourse(token, courseTitle.trim(), courseCategory);
      setProcessingProgress(10);

      // 2. Upload each module with its video
      const totalModulesWithVideo = modules.filter((m) => m.file).length;
      let uploadedCount = 0;

      for (let i = 0; i < modules.length; i++) {
        const mod = modules[i];
        if (!mod.file) {
          updateModule(i, { uploadStatus: "done" });
          continue;
        }

        setProcessingStatus(`Uploading module ${i + 1}/${modules.length}: ${mod.title}...`);
        updateModule(i, { uploadStatus: "uploading" });

        try {
          const result = await uploadModule(token, course_id, mod.title.trim(), mod.file);
          updateModule(i, { uploadStatus: "done", moduleId: result.module_id });
          uploadedCount++;
          setProcessingProgress(10 + Math.round((uploadedCount / totalModulesWithVideo) * 80));
          toast.success(`Module "${mod.title}" uploaded — AI processing started`);
        } catch (err: any) {
          updateModule(i, { uploadStatus: "error", error: err.message || "Upload failed" });
          toast.error(`Failed to upload "${mod.title}"`);
        }
      }

      setProcessingProgress(100);
      setProcessingStatus("Course created successfully!");
      setStep("complete");
    } catch (err: any) {
      console.error("Create course failed:", err);
      toast.error("Failed to create course: " + (err.message || "Unknown error"));
      setStep("modules");
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: "info", label: "Course Info", icon: BookOpen },
      { id: "modules", label: "Modules & Videos", icon: Video },
      { id: "processing", label: "Processing", icon: Brain },
    ];

    const currentStepIndex = steps.findIndex((s) => s.id === step);

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isComplete = index < currentStepIndex || step === "complete";

          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isComplete
                      ? "bg-success text-success-foreground"
                      : isActive
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={`text-xs mt-2 ${
                    isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 ${isComplete ? "bg-success" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <TrainerLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/trainer/courses")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to courses
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create New Course</h1>
          <p className="text-muted-foreground">Follow the steps to create and publish your course</p>
        </div>

        {step !== "complete" && renderStepIndicator()}

        {/* Step 1: Course Info */}
        {step === "info" && (
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <CardDescription>Provide basic details about your course</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  Course Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Advanced Machine Learning"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  Category <span className="text-destructive">*</span>
                </Label>
                <select
                  id="category"
                  value={courseCategory}
                  onChange={(e) => setCourseCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button onClick={() => navigate("/trainer/courses")} variant="outline">
                  Cancel
                </Button>
                <Button onClick={() => { if (validateStep()) setStep("modules"); }}>
                  Next: Add Modules <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Modules with video files */}
        {step === "modules" && (
          <Card>
            <CardHeader>
              <CardTitle>Course Modules</CardTitle>
              <CardDescription>
                Each module is a video lesson. Upload a video file and AI will automatically generate
                transcripts, summaries, and quiz questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {modules.map((mod, index) => (
                <div key={index} className="p-4 rounded-lg border border-border bg-muted/30 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label>Module {index + 1} Title</Label>
                        <Input
                          placeholder="e.g., Introduction to Neural Networks"
                          value={mod.title}
                          onChange={(e) => updateModule(index, { title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Video File</Label>
                        <div className="flex items-center gap-3">
                          <Input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) updateModule(index, { file });
                            }}
                            className="flex-1"
                          />
                          {mod.file && (
                            <Badge variant="outline" className="whitespace-nowrap">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {mod.file.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          AI will automatically transcribe the video, generate a summary, and create quiz questions.
                        </p>
                      </div>
                    </div>
                    {modules.length > 1 && (
                      <Button variant="outline" size="icon" onClick={() => removeModule(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              <Button onClick={addModule} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Module
              </Button>

              <div className="flex justify-between gap-3 pt-4 border-t">
                <Button onClick={() => setStep("info")} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button onClick={handleCreateAndUpload} disabled={loading}>
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <><Brain className="w-4 h-4 mr-2" /> Create Course & Upload</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 animate-pulse" /> Creating Course
              </CardTitle>
              <CardDescription>
                Uploading videos and starting AI processing...
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{processingStatus}</p>
                <Progress value={processingProgress} className="h-2" />
              </div>

              {/* Module status list */}
              <div className="space-y-2">
                {modules.map((mod, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    {mod.uploadStatus === "done" ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : mod.uploadStatus === "uploading" ? (
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                    ) : mod.uploadStatus === "error" ? (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-border" />
                    )}
                    <span className={mod.uploadStatus === "done" ? "text-muted-foreground" : "text-foreground"}>
                      {mod.title}
                    </span>
                    {mod.error && <span className="text-xs text-destructive">{mod.error}</span>}
                  </div>
                ))}
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  AI processing (transcription, summary, quiz generation) continues in the background
                  after upload. You can check the status on your course management page.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <Card className="text-center">
            <CardContent className="pt-12 pb-12">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Course Created Successfully!</h2>
              <p className="text-muted-foreground mb-2">
                Your course "{courseTitle}" has been created with {modules.length} module(s).
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                AI is processing your videos in the background. Transcripts, summaries, and quizzes
                will be available once processing completes.
              </p>
              <Button onClick={() => navigate("/trainer/courses-management")}>
                View My Courses
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </TrainerLayout>
  );
};

export default CreateCourse;
