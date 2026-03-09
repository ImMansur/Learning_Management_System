import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import TrainerLayout from "@/components/TrainerLayout";
import { getAllCourses } from "@/data/courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Upload, Trash2, ArrowLeft, Sparkles } from "lucide-react";

const TrainerCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const course = getAllCourses().find((c) => c.id === courseId);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonType, setNewLessonType] = useState<"video" | "reading" | "exercise" | "quiz">("video");
  const [uploadedFile, setUploadedFile] = useState<string>("");

  if (!course) {
    return (
      <TrainerLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Course not found.</p>
        </div>
      </TrainerLayout>
    );
  }

  const handleAddLesson = () => {
    setShowAddLesson(false);
    setNewLessonTitle("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const generateAISummary = () => {
    alert("Generating AI summary for this lesson...");
  };

  return (
    <TrainerLayout>
      <button
        onClick={() => navigate("/trainer/courses")}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </button>

      {/* Course Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{course.title}</h1>
            <p className="text-muted-foreground max-w-2xl">{course.description}</p>
          </div>
          <div className="text-right">
            <span className="inline-block px-4 py-2 rounded-lg bg-success/10 text-success font-medium text-sm">
              {course.status === "published" ? "Published" : "Draft"}
            </span>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-6">
        {course.modules.map((module, moduleIndex) => (
          <div key={module.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/50">
              <h2 className="text-lg font-semibold text-card-foreground">
                Module {moduleIndex + 1}: {module.title}
              </h2>
            </div>

            <div className="divide-y divide-border">
              {module.lessons.map((lesson) => (
                <div key={lesson.id} className="px-6 py-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <Link to={`/courses/${course.id}/lesson/${lesson.id}`} className="block">
                        <p className="text-sm font-medium text-card-foreground">{lesson.title}</p>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-1">
                        Type: {lesson.type} • Created: {lesson.createdDate ? new Date(lesson.createdDate).toLocaleDateString() : "N/A"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs rounded-lg border border-border text-foreground hover:bg-muted transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1 text-xs rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lesson Content */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {lesson.contentUrl && (
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-2">Video Content</p>
                        <p className="text-sm font-medium text-foreground truncate">{lesson.contentUrl}</p>
                      </div>
                    )}
                    {lesson.videoUrl && (
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-2">Video Content</p>
                        <p className="text-sm font-medium text-foreground truncate">{lesson.videoUrl}</p>
                      </div>
                    )}
                    {lesson.transcriptUrl && (
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-2">Transcript</p>
                        <p className="text-sm font-medium text-foreground truncate">{lesson.transcriptUrl}</p>
                      </div>
                    )}
                    {lesson.slidesUrl && (
                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-xs text-muted-foreground mb-2">Slides</p>
                        <p className="text-sm font-medium text-foreground truncate">{lesson.slidesUrl}</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Section */}
                  <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-dashed border-border">
                    <p className="text-xs text-muted-foreground mb-3">Upload Additional Content</p>
                    <div className="flex gap-2 flex-wrap">
                      <label className="flex-1 min-w-[150px] px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer transition-colors flex items-center justify-center gap-2 text-sm">
                        <Upload className="w-4 h-4" />
                        Upload Video
                        <input type="file" accept="video/*" onChange={handleFileUpload} hidden />
                      </label>
                      <label className="flex-1 min-w-[150px] px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer transition-colors flex items-center justify-center gap-2 text-sm">
                        <Upload className="w-4 h-4" />
                        Upload Slides
                        <input type="file" accept=".pdf,.pptx" onChange={handleFileUpload} hidden />
                      </label>
                      <label className="flex-1 min-w-[150px] px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted cursor-pointer transition-colors flex items-center justify-center gap-2 text-sm">
                        <Upload className="w-4 h-4" />
                        Upload Transcript
                        <input type="file" accept=".txt,.pdf" onChange={handleFileUpload} hidden />
                      </label>
                      <button
                        onClick={generateAISummary}
                        className="px-4 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center justify-center gap-2 text-sm font-medium whitespace-nowrap"
                      >
                        <Sparkles className="w-4 h-4" />
                        AI Summary
                      </button>
                    </div>
                    {uploadedFile && (
                      <p className="text-xs text-success mt-2">✓ Uploaded: {uploadedFile}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add Lesson */}
            <div className="px-6 py-4 bg-muted/30 border-t border-border">
              {!showAddLesson ? (
                <button
                  onClick={() => setShowAddLesson(true)}
                  className="flex items-center gap-2 text-sm text-accent font-medium hover:opacity-80 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Add Lesson
                </button>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Lesson title..."
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <select
                      value={newLessonType}
                      onChange={(e) => setNewLessonType(e.target.value as any)}
                      className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm"
                    >
                      <option value="video">Video</option>
                      <option value="reading">Reading</option>
                      <option value="exercise">Exercise</option>
                      <option value="quiz">Quiz</option>
                    </select>
                    <Button size="sm" onClick={handleAddLesson}>
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddLesson(false);
                        setNewLessonTitle("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </TrainerLayout>
  );
};

export default TrainerCourseDetail;
