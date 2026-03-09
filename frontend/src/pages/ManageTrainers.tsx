import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { users as initialUsers, User } from "@/data/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User as UserIcon } from "lucide-react";

const LOCAL_KEY = "admin_users";

const ManageTrainers = () => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : initialUsers;
    } catch (e) {
      return initialUsers;
    }
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(users));
  }, [users]);

  const trainers = users.filter((u) => u.role === "Trainer");

  const demote = (email: string) => {
    if (!confirm("Demote trainer to Learner?")) return;
    setUsers((s) => s.map((u) => (u.email === email ? { ...u, role: "Learner" } : u)));
  };

  const addTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const name = (formData.get("name") as string)?.trim();

    if (!email || !name) return;
    if (users.find((u) => u.email === email)) {
      alert("User with that email already exists");
      return;
    }

    const newUser: User = { email, name, password: "123", role: "Trainer" };
    setUsers((s) => [newUser, ...s]);
    form.reset();
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Trainers</h1>
          <p className="text-sm text-muted-foreground">Invite new trainers or demote existing ones</p>
        </div>
      </div>

      <form onSubmit={addTrainer} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input name="name" placeholder="Full name" required />
        <Input name="email" type="email" placeholder="email@example.com" required />
        <div />
        <Button type="submit">Add Trainer</Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trainers.map((t) => (
          <div key={t.email} className="p-4 rounded-lg border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.email}</p>
              </div>
            </div>
            <div>
              <Button variant="destructive" size="sm" onClick={() => demote(t.email)}>Demote</Button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default ManageTrainers;
