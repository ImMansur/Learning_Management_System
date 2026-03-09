import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import {
  User,
  Bell,
  Lock,
  Download,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Moon,
  Sun,
  Globe,
} from "lucide-react";

const LearnerSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useUser();
  const [activeTab, setActiveTab] = useState<"profile" | "preferences" | "privacy" | "security">("profile");
  
  // Profile state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    lessonReminders: true,
    progressAlerts: true,
    language: "en",
    theme: "system",
  });

  // Privacy state
  const [privacy, setPrivacy] = useState({
    profileVisibility: "private",
    allowMessages: false,
    shareProgress: false,
  });

  // Security state
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Handle profile save
  const handleProfileSave = () => {
    if (!profileData.name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    toast.success("Profile updated successfully!");
  };

  // Handle preferences save
  const handlePreferencesSave = () => {
    toast.success("Preferences saved!");
  };

  // Handle privacy save
  const handlePrivacySave = () => {
    toast.success("Privacy settings updated!");
  };

  // Handle password change
  const handlePasswordChange = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    toast.success("Password changed successfully!");
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const handleDownloadData = () => {
    toast.success("Downloading your learning data...");
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </button>

        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, and learning settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="space-y-2 sticky top-4">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "preferences", label: "Preferences", icon: Bell },
              { id: "privacy", label: "Privacy", icon: Eye },
              { id: "security", label: "Security", icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your basic profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 pb-6 border-b border-border">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent/50 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-2">Role: {user?.role}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder="Your full name"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="mt-2 bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Email cannot be changed</p>
                  </div>

                  <div>
                    <Label htmlFor="joined">Member Since</Label>
                    <Input
                      id="joined"
                      type="text"
                      value={new Date().toLocaleDateString()}
                      disabled
                      className="mt-2 bg-muted"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handleProfileSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your learning experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Notifications */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Notifications</h3>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive updates about your courses</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) =>
                        setPreferences({ ...preferences, emailNotifications: e.target.checked })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">Lesson Reminders</p>
                      <p className="text-sm text-muted-foreground">Get reminded about lessons due</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.lessonReminders}
                      onChange={(e) =>
                        setPreferences({ ...preferences, lessonReminders: e.target.checked })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">Progress Alerts</p>
                      <p className="text-sm text-muted-foreground">Celebrate milestones and achievements</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.progressAlerts}
                      onChange={(e) =>
                        setPreferences({ ...preferences, progressAlerts: e.target.checked })
                      }
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Display Settings */}
                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="font-semibold text-foreground">Display</h3>

                  <div>
                    <Label className="text-foreground mb-3 block">Theme</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: "light", label: "Light", icon: Sun },
                        { value: "dark", label: "Dark", icon: Moon },
                        { value: "system", label: "System", icon: Globe },
                      ].map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setPreferences({ ...preferences, theme: option.value })}
                            className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center gap-2 ${
                              preferences.theme === option.value
                                ? "border-accent bg-accent/10"
                                : "border-border hover:border-accent/50"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="language" className="text-foreground">Language</Label>
                    <select
                      id="language"
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full mt-2 px-4 py-2 rounded-lg bg-muted border border-border text-foreground"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handlePreferencesSave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                  <Button variant="outline">Reset to Default</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data</CardTitle>
                <CardDescription>Control how your data is used and shared</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Privacy Settings</h3>

                  <div className="space-y-3">
                    <Label className="text-foreground">Profile Visibility</Label>
                    <div className="space-y-2">
                      {[
                        { value: "private", label: "Private", desc: "Only you can see your profile" },
                        { value: "trainers", label: "Trainers Only", desc: "Your trainers can see your profile" },
                        { value: "public", label: "Public", desc: "Everyone can see your profile" },
                      ].map((option) => (
                        <div
                          key={option.value}
                          onClick={() => setPrivacy({ ...privacy, profileVisibility: option.value })}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            privacy.profileVisibility === option.value
                              ? "border-accent bg-accent/10"
                              : "border-border hover:border-accent/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              checked={privacy.profileVisibility === option.value}
                              readOnly
                              className="w-4 h-4"
                            />
                            <div>
                              <p className="font-medium text-foreground">{option.label}</p>
                              <p className="text-sm text-muted-foreground">{option.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="font-semibold text-foreground">Data & Account</h3>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">Allow Messages from Others</p>
                      <p className="text-sm text-muted-foreground">Let other learners send you messages</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.allowMessages}
                      onChange={(e) => setPrivacy({ ...privacy, allowMessages: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-medium text-foreground">Share Progress Data</p>
                      <p className="text-sm text-muted-foreground">Allow us to use your data for platform improvements</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.shareProgress}
                      onChange={(e) => setPrivacy({ ...privacy, shareProgress: e.target.checked })}
                      className="w-5 h-5 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-6 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={handleDownloadData}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download My Data
                  </Button>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={handlePrivacySave}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                  <Button variant="outline">Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security and authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Change Password</h3>

                  <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <div className="relative mt-2">
                        <Input
                          id="currentPassword"
                          type={showPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) =>
                            setPasswordData({ ...passwordData, currentPassword: e.target.value })
                          }
                          placeholder="Enter your current password"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        placeholder="Enter new password"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Must be at least 6 characters long
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        placeholder="Confirm new password"
                        className="mt-2"
                      />
                    </div>

                    <Button onClick={handlePasswordChange} className="w-full">
                      Update Password
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="font-semibold text-foreground">Active Sessions</h3>
                  <div className="p-4 border border-border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">Current Session</p>
                        <p className="text-sm text-muted-foreground">This device • Last active now</p>
                      </div>
                      <span className="inline-block px-3 py-1 rounded-lg bg-success/10 text-success text-xs font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-border">
                  <h3 className="font-semibold text-foreground">Danger Zone</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full" onClick={handleLogout}>
                      Logout from All Devices
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => toast.error("Account deletion not yet implemented")}
                    >
                      Delete Account Permanently
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default LearnerSettings;
