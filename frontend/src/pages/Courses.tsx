// Import fallback images
import courseAi from "@/assets/course-ai.jpg";
import courseData from "@/assets/course-data.jpg";
import courseCloud from "@/assets/course-cloud.jpg";
import courseDevops from "@/assets/course-devops.jpg";

const fallbackImages = [courseAi, courseData, courseCloud, courseDevops];

import { useState, useEffect } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { getCourseCatalog, enrollInCourse, getMyProfile, BackendCourse, StudentProfile } from "@/services/lmsService";
import { useUser } from "@/context/UserContext";
import { Search, BookOpen, Clock, Loader2, CheckCircle2, LogIn, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const categories = ["All", "AI / ML", "Data", "Cloud", "DevOps", "Web Development", "Mobile Development", "GenAi"];

const Courses = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, getToken } = useUser();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [courses, setCourses] = useState<BackendCourse[]>([]);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const [catalogData, profileData] = await Promise.all([
          getCourseCatalog(token),
          getMyProfile(token).catch(() => null),
        ]);
        setCourses(catalogData);
        setProfile(profileData);
      } catch (err) {
        console.error("Failed to fetch courses:", err);
        toast.error("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.key, user, getToken]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    setEnrollingId(courseId);
    try {
      const token = await getToken();
      await enrollInCourse(token, courseId);
      toast.success("Successfully enrolled!");
      // Refresh profile to update enrollment state
      const updatedProfile = await getMyProfile(token).catch(() => null);
      setProfile(updatedProfile);
    } catch (err: any) {
      toast.error("Enrollment failed: " + (err.message || "Unknown error"));
    } finally {
      setEnrollingId(null);
    }
  };

  const isEnrolled = (courseId: string) =>
    profile?.enrollments && courseId in profile.enrollments;

  const filtered = courses.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === "All" || c.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Courses</h1>
        <p className="text-muted-foreground">Browse and continue your learning journey</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-gradient-accent text-accent-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted-foreground">No courses found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course) => {
            const enrolled = isEnrolled(course.id);
            const completedModules = profile?.enrollments?.[course.id]?.completed_modules?.length ?? 0;
            const totalModules = course.module_count ?? 0;
            const progress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

            // Pick a random fallback image if course.image is missing/empty/undefined
            const courseImage = course.image && course.image.trim() !== "" ? course.image : fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
            return (
              <div
                key={course.id}
                className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group relative"
              >
                {/* Category badge */}
                {course.category && (
                  <span className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
                    {course.category}
                  </span>
                )}
                {/* Completed badge */}
                {enrolled && progress === 100 && (
                  <span className="absolute top-3 right-3 bg-success text-white text-xs font-bold px-3 py-1 rounded-full shadow-md z-10">
                    Completed
                  </span>
                )}
                {/* Course image with hover play button */}
                <div className="relative w-full h-40 group/image">
                  <img
                    src={courseImage}
                    alt={course.title}
                    className="w-full h-40 object-cover object-center"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 bg-black/30 cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="white" viewBox="0 0 24 24" width="48" height="48" className="drop-shadow-lg">
                      <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.5)" />
                      <polygon points="10,8 16,12 10,16" fill="white" />
                    </svg>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-accent text-lg mb-1 group-hover:text-accent/80 transition-colors">
                    {course.title}
                  </h3>
                  {course.instructor_name && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {course.instructor_name}
                    </p>
                  )}
                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {totalModules} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {totalModules > 0 ? `${totalModules * 30}m` : "0m"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course.enrolled_count ?? 0}
                    </span>
                  </div>

                  {enrolled && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-card-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {enrolled ? (
                      <button
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-success/10 text-success text-sm font-semibold hover:bg-success/20 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Continue Learning
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        disabled={enrollingId === course.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-accent text-accent-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {enrollingId === course.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogIn className="w-4 h-4" />
                        )}
                        {enrollingId === course.id ? "Enrolling..." : "Enroll"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
};

export default Courses;
