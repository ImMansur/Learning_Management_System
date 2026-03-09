import TrainerLayout from "@/components/TrainerLayout";
import { Settings } from "lucide-react";
import { useUser } from "@/context/UserContext";

const TrainerSettings = () => {
  const { user } = useUser();

  return (
    <TrainerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account and course settings</p>
      </div>

      {/* Profile Section */}
      <div className="bg-card rounded-xl border border-border p-8 mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-6">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <p className="text-lg font-medium text-foreground">{user?.name}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <p className="text-lg font-medium text-foreground">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Role</label>
            <p className="text-lg font-medium text-foreground">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Course Settings */}
      <div className="bg-card rounded-xl border border-border p-8">
        <h2 className="text-xl font-semibold text-foreground mb-6">Course Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Auto-publish transcripts</p>
              <p className="text-sm text-muted-foreground">Automatically publish video transcripts when uploaded</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Enable AI summaries</p>
              <p className="text-sm text-muted-foreground">Allow AI to generate lesson summaries automatically</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border border-border rounded-lg">
            <div>
              <p className="font-medium text-foreground">Email notifications</p>
              <p className="text-sm text-muted-foreground">Get notified about student progress updates</p>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>
        </div>
      </div>
    </TrainerLayout>
  );
};

export default TrainerSettings;
