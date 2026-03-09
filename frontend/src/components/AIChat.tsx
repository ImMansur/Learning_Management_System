import { useState } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const sampleMessages: Message[] = [
  {
    id: 1,
    role: "assistant",
    content: "Hello! I'm your AI Knowledge Assistant. I can help you find answers from course materials, generate summaries, create revision content, and explain concepts. What would you like to explore?",
    timestamp: "10:00 AM",
  },
];

export const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const assistantMsg: Message = {
      id: messages.length + 2,
      role: "assistant",
      content: "I'm currently in demo mode. Once connected to the knowledge base, I'll be able to search through course materials, generate summaries, answer questions, and create personalized revision content for you.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...messages, userMsg, assistantMsg]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-gradient-primary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <h2 className="font-semibold text-primary-foreground">Knowledge Assistant</h2>
            <p className="text-xs text-primary-foreground/60">Powered by AI · Search across all materials</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fade-in`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === "assistant"
                  ? "bg-accent/10 text-accent"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {msg.role === "assistant" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div
              className={`max-w-[75%] rounded-xl px-4 py-3 ${
                msg.role === "assistant"
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.content}</p>
              <p className={`text-[10px] mt-2 ${msg.role === "assistant" ? "text-muted-foreground" : "text-primary-foreground/50"}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 border-t border-border">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["Summarize last lecture", "Explain transformers", "Quiz me on ML basics", "Generate revision notes"].map(
            (action) => (
              <button
                key={action}
                onClick={() => setInput(action)}
                className="px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-background text-muted-foreground hover:text-foreground hover:border-accent transition-colors whitespace-nowrap"
              >
                {action}
              </button>
            )
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask anything about your courses..."
            className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/30 transition-all"
          />
          <Button
            onClick={handleSend}
            className="rounded-xl bg-gradient-accent hover:opacity-90 text-accent-foreground px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
