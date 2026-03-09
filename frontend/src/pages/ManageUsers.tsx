import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { users as initialUsers, User } from "@/data/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User as UserIcon } from "lucide-react";

const LOCAL_KEY = "admin_users";

const ManageUsers = () => {
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

  const addUser = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = (formData.get("email") as string)?.trim().toLowerCase();
    const name = (formData.get("name") as string)?.trim();
    const role = (formData.get("role") as string) || "Learner";

    if (!email || !name) return;

    if (users.find((u) => u.email === email)) {
      alert("User with that email already exists");
      return;
    }

    const newUser: User = { email, name, password: "123", role };
    setUsers((s) => [newUser, ...s]);
    form.reset();
  };

  const editUser = (email: string) => {
    const u = users.find((x) => x.email === email);
    if (!u) return;
    const name = prompt("Name:", u.name) || u.name;
    const role = prompt("Role (Admin/Trainer/Learner):", u.role) || u.role;
    setUsers((s) => s.map((x) => (x.email === email ? { ...x, name, role } : x)));
  };

  const deleteUser = (email: string) => {
    if (!confirm("Delete user?")) return;
    setUsers((s) => s.filter((x) => x.email !== email));
  };

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <p className="text-sm text-muted-foreground">Create, edit and remove users from the platform</p>
        </div>
      </div>

      <form onSubmit={addUser} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Input name="name" placeholder="Full name" required />
        <Input name="email" type="email" placeholder="email@example.com" required />
        <select name="role" className="rounded-md border px-3 py-2">
          <option>Learner</option>
          <option>Trainer</option>
          <option>Admin</option>
        </select>
        <Button type="submit">Add User</Button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((u) => (
          <div key={u.email} className="p-4 rounded-lg border bg-card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted-foreground">{u.email} • {u.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => editUser(u.email)}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteUser(u.email)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default ManageUsers;
