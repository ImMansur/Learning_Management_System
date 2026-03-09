import AppLayout from "@/components/AppLayout";
import { AIChat } from "@/components/AIChat";

const Assistant = () => {
  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">AI Knowledge Assistant</h1>
        <p className="text-muted-foreground">Ask questions, generate summaries, and explore course materials</p>
      </div>
      <AIChat />
    </AppLayout>
  );
};

export default Assistant;
