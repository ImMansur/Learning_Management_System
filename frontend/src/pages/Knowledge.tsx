import AppLayout from "@/components/AppLayout";
import { Upload, FileText, Video, Mic, FileSearch } from "lucide-react";

const knowledgeItems = [
  { title: "ML Fundamentals - Lecture 3 Transcript", type: "Transcript", icon: FileText, date: "Feb 10, 2026", status: "Processed" },
  { title: "Deep Learning Workshop Recording", type: "Video", icon: Video, date: "Feb 8, 2026", status: "Processing" },
  { title: "Data Pipelines Q&A Session", type: "Audio", icon: Mic, date: "Feb 6, 2026", status: "Processed" },
  { title: "Cloud Architecture Slide Deck", type: "Document", icon: FileSearch, date: "Feb 4, 2026", status: "Processed" },
];

const Knowledge = () => {
  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-1">Knowledge Base</h1>
        <p className="text-muted-foreground">Upload materials and transform them into structured intelligence</p>
      </div>

      {/* Upload area */}
      <div className="bg-card border-2 border-dashed border-border rounded-2xl p-12 text-center mb-8 hover:border-accent/50 transition-colors cursor-pointer">
        <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-7 h-7 text-accent" />
        </div>
        <h3 className="font-semibold text-card-foreground mb-2">Upload Learning Materials</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Drop recordings, transcripts, slide decks, notes, or exercises here. Our AI will process and structure them automatically.
        </p>
        <p className="text-xs text-muted-foreground mt-3">
          Supports: MP4, MP3, PDF, PPTX, DOCX, TXT, MD
        </p>
      </div>

      {/* Knowledge items */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-card-foreground">Recent Uploads</h3>
        </div>
        <div className="divide-y divide-border">
          {knowledgeItems.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-card-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.type} · {item.date}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  item.status === "Processed"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Knowledge;
