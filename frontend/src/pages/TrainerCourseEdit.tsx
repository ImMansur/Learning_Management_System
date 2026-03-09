import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TrainerLayout from "@/components/TrainerLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  Save,
  AlertCircle,
  Edit3,
} from "lucide-react";
import { toast } from "sonner";
import { getAllCourses } from "@/data/courses";
import { saveCourse } from "@/services/courseService";
import { Course, Module, Lesson } from "@/data/courses";

interface LessonForm extends Lesson {
  isNew?: boolean;
}

interface ModuleForm extends Module {
  lessons: LessonForm[];
  isNew?: boolean;
}

const TrainerCourseEdit = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  // Load existing course
  const existingCourse = getAllCourses().find((c) => c.id === courseId);

  if (!existingCourse) {
    return (
      <TrainerLayout>
        <div className="mb-8">
          <button
            onClick={() => navigate("/trainer/courses")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to courses
          </button>
        </div>
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-foreground font-semibold mb-2">Course not found</p>
            <p className="text-muted-foreground mb-6">The course you're trying to edit doesn't exist.</p>
            <Button onClick={() => navigate("/trainer/courses")}>
              Back to Courses
            </Button>
          </CardContent>
        </Card>
      </TrainerLayout>
    );
  }

  // Course Info State
  const [courseTitle, setCourseTitle] = useState(existingCourse.title);
  const [courseDescription, setCourseDescription] = useState(existingCourse.description);
  const [courseCategory, setCourseCategory] = useState(existingCourse.category);
  const [courseImage, setCourseImage] = useState(existingCourse.image);

  // Modules and Lessons State
  const [modules, setModules] = useState<ModuleForm[]>(existingCourse.modules);

  const categories = [
    "AI / ML",
    "Data",
    "Cloud",
    "DevOps",
    "Web Development",
    "Mobile Development",
  ];

  // Module Management
  const addModule = () => {
    const newModule: ModuleForm = {
      id: `m${Date.now().toString(36)}`,
      title: "",
      lessons: [],
      isNew: true,
    };
    setModules([...modules, newModule]);
  };

  const removeModule = (index: number) => {
    if (modules.length === 1) {
      toast.error("Course must have at least one module");
      return;
    }
    const newModules = modules.filter((_, i) => i !== index);
    setModules(newModules);
    if (activeModuleIndex >= newModules.length) {
      setActiveModuleIndex(newModules.length - 1);
    }
  };

  const updateModuleTitle = (index: number, title: string) => {
    const newModules = [...modules];
    newModules[index].title = title;
    setModules(newModules);
  };

  // Lesson Management
  const addLesson = (moduleIndex: number) => {
    const newModules = [...modules];
    const newLesson: LessonForm = {
      id: `l${Date.now().toString(36)}`,
      title: "",
      duration: "0m",
      type: "video",
      completed: false,
      isNew: true,
    };
    newModules[moduleIndex].lessons.push(newLesson);
    setModules(newModules);
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter(
      (_, i) => i !== lessonIndex
    );
    setModules(newModules);
  };

  const updateLesson = (
    moduleIndex: number,
    lessonIndex: number,
    updates: Partial<LessonForm>
  ) => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons[lessonIndex] = {
      ...newModules[moduleIndex].lessons[lessonIndex],
      ...updates,
    };
    setModules(newModules);
  };

  // Validation
  const validateForm = (): boolean => {
    if (!courseTitle.trim() || !courseDescription.trim() || !courseCategory) {
      toast.error("Please fill in all required course fields");
      return false;
    }

    const hasEmptyModules = modules.some((m) => !m.title.trim());
    if (hasEmptyModules) {
      toast.error("All modules must have a title");
      return false;
    }

    if (modules.length === 0) {
      toast.error("Course must have at least one module");
      return false;
    }

    const hasEmptyLessons = modules.some((m) =>
      m.lessons.some((l) => !l.title.trim())
    );
    if (hasEmptyLessons) {
      toast.error("All lessons must have a title");
      return false;
    }

    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    if (totalLessons === 0) {
      toast.error("Course must have at least one lesson");
      return false;
    }

    return true;
  };

  // Save Course
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const updatedCourse: Course = {
        ...existingCourse,
        title: courseTitle,
        description: courseDescription,
        category: courseCategory,
        image: courseImage || existingCourse.image,
        modules: modules,
        lessons: modules.reduce((sum, m) => sum + m.lessons.length, 0),
      };

      saveCourse(updatedCourse);
      toast.success("Course updated successfully!");

      setTimeout(() => {
        navigate("/trainer/courses");
      }, 1500);
    } catch (error) {
      console.error("Failed to save course:", error);
      toast.error("Failed to save course. Please try again.");
    } finally {
      setSaving(false);
    }
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

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              <Edit3 className="w-8 h-8 inline mr-2 text-accent" />
              Edit Course
            </h1>
            <p className="text-muted-foreground">
              Update course information, modules, and lessons
            </p>
          </div>
          <Badge variant="secondary">{existingCourse.id}</Badge>
        </div>

        {/* Course Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>Update basic course details</CardDescription>
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
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                placeholder="Describe what students will learn..."
                value={courseDescription}
                onChange={(e) => setCourseDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none"
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Course Image URL</Label>
                <Input
                  id="image"
                  placeholder="https://example.com/image.jpg"
                  value={courseImage}
                  onChange={(e) => setCourseImage(e.target.value)}
                />
              </div>
            </div>

            {courseImage && (
              <div className="pt-4">
                <Label className="text-muted-foreground text-xs mb-2 block">Preview</Label>
                <img
                  src={courseImage}
                  alt="Course"
                  className="w-32 h-32 rounded-lg object-cover border border-border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modules */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Course Modules</CardTitle>
            <CardDescription>Edit modules and their lessons</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Module Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border">
              {modules.map((module, index) => (
                <button
                  key={index}
                  onClick={() => setActiveModuleIndex(index)}
                  className={`px-4 py-2 rounded-t-lg whitespace-nowrap transition-colors ${
                    activeModuleIndex === index
                      ? "bg-accent text-accent-foreground border-b-2 border-accent"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {module.title || `Module ${index + 1}`}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {module.lessons.length}
                  </Badge>
                </button>
              ))}
              <button
                onClick={addModule}
                className="px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-t-lg transition-colors"
              >
                <Plus className="w-4 h-4 inline" />
              </button>
            </div>

            {/* Module Edit Section */}
            <div className="space-y-4">
              {modules[activeModuleIndex] && (
                <div className="space-y-6">
                  {/* Module Title */}
                  <div className="space-y-2">
                    <Label htmlFor="module-title">
                      Module {activeModuleIndex + 1} Title <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="module-title"
                        placeholder="e.g., Introduction to AI"
                        value={modules[activeModuleIndex].title}
                        onChange={(e) => updateModuleTitle(activeModuleIndex, e.target.value)}
                      />
                      {modules.length > 1 && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeModule(activeModuleIndex)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Lessons in Module */}
                  <div className="space-y-3 pt-4 border-t border-border">
                    <h4 className="font-semibold text-foreground">Lessons</h4>
                    {modules[activeModuleIndex].lessons.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">No lessons yet. Add one below.</p>
                    ) : (
                      modules[activeModuleIndex].lessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className="p-4 rounded-lg border border-border bg-muted/30 space-y-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className="col-span-2 space-y-2">
                                <Label>Lesson Title</Label>
                                <Input
                                  placeholder="e.g., What is AI?"
                                  value={lesson.title}
                                  onChange={(e) =>
                                    updateLesson(activeModuleIndex, lessonIndex, {
                                      title: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Duration</Label>
                                <Input
                                  placeholder="e.g., 45m"
                                  value={lesson.duration}
                                  onChange={(e) =>
                                    updateLesson(activeModuleIndex, lessonIndex, {
                                      duration: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Type</Label>
                                <select
                                  value={lesson.type}
                                  onChange={(e) =>
                                    updateLesson(activeModuleIndex, lessonIndex, {
                                      type: e.target.value as any,
                                    })
                                  }
                                  className="w-full px-4 py-2 rounded-lg bg-background border border-border"
                                >
                                  <option value="video">Video</option>
                                  <option value="reading">Reading</option>
                                  <option value="exercise">Exercise</option>
                                  <option value="quiz">Quiz</option>
                                </select>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeLesson(activeModuleIndex, lessonIndex)}
                              className="mt-6"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}

                    <Button
                      onClick={() => addLesson(activeModuleIndex)}
                      variant="outline"
                      className="w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Lesson
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="mb-8 bg-muted/50 border-muted">
          <CardContent className="pt-6">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Modules</p>
                <p className="text-2xl font-bold text-foreground">{modules.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Lessons</p>
                <p className="text-2xl font-bold text-foreground">
                  {modules.reduce((sum, m) => sum + m.lessons.length, 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Modified</p>
                <p className="text-sm text-foreground">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            onClick={() => navigate("/trainer/courses-management")}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <CheckCircle2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerCourseEdit;
