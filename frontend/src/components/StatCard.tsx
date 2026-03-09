import { Progress } from "@/components/ui/progress";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  progress?: number;
}

export const StatCard = ({ title, value, subtitle, icon, progress }: StatCardProps) => {
  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold text-card-foreground">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      {progress !== undefined && (
        <Progress value={progress} className="h-2 mb-2" />
      )}
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
};
