import { ReactNode } from "react";
import { TrainerSidebar } from "@/components/TrainerSidebar";

interface TrainerLayoutProps {
  children: ReactNode;
}

const TrainerLayout = ({ children }: TrainerLayoutProps) => {
  return (
    <div className="flex min-h-screen">
      <TrainerSidebar />
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default TrainerLayout;
