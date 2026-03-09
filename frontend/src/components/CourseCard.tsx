import { Link } from "react-router-dom";
import { Clock, Users, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  lessons: number;
  duration: string;
  students: number;
  progress?: number;
  category: string;
  createdBy: string;
}

export const CourseCard = ({
  id,
  title,
  description,
  image,
  lessons,
  duration,
  students,
  progress,
  category,
  createdBy,
}: CourseCardProps) => {
  return (
    <Link
      to={`/courses/${id}`}
      className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground">
            {category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-card-foreground text-lg mb-2 group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="text-xs text-muted-foreground mb-2">{createdBy}</p>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {lessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {duration}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {students}
          </span>
        </div>

        {progress !== undefined && (
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-semibold text-card-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </Link>
  );
};
