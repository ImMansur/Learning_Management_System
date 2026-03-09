import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { trainerCourses as initialCourses, TrainerCourse } from "@/data/trainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen } from "lucide-react";

const LOCAL_KEY = "admin_courses";

const ManageCoursesAdmin = () => {
  const [courses, setCourses] = useState<TrainerCourse[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : initialCourses;
    } catch (e) {
      return initialCourses;
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(courses));
  }, [courses]);

  const addCourse = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || "";
    const category = (formData.get("category") as string) || "General";

    if (!title) return;

    const newCourse: TrainerCourse = {
      id: `c-${Date.now()}`,
      title,
      description,
      category,
      modules: [],
      enrolledStudents: 0,
      createdDate: new Date().toISOString(),
      status: "draft",
    };

    setCourses((s) => [newCourse, ...s]);
    form.reset();
  };

  const editCourse = (id: string) => {
    const c = courses.find((x) => x.id === id);
    if (!c) return;
    const title = prompt("Title:", c.title) || c.title;
    const description = prompt("Description:", c.description) || c.description;
    setCourses((s) => s.map((x) => (x.id === id ? { ...x, title, description } : x)));
  };

  const deleteCourse = (id: string) => {
    if (!confirm("Delete course?")) return;
    setCourses((s) => s.filter((x) => x.id !== id));
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Courses</h1>
          <p className="text-sm text-muted-foreground">Create, edit and remove courses</p>
        </div>
      </div>

      <form onSubmit={addCourse} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input name="title" placeholder="Course title" required />
        <Input name="category" placeholder="Category" />
        <Input name="description" placeholder="Short description" />
        <div />
        <div />
        <Button type="submit">Add Course</Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((c) => (
          <div key={c.id} className="p-4 rounded-lg border bg-card flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-lg">{c.title}</p>
                  <p className="text-sm text-muted-foreground">{c.description}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Category: {c.category} • Status: {c.status}</p>
            </div>
            <div className="mt-3 flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => editCourse(c.id)}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteCourse(c.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default ManageCoursesAdmin;
