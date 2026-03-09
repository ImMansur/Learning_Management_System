import AdminLayout from "@/components/AdminLayout";

const AdminAnalytics = () => {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">Admin Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-card">Placeholder chart 1</div>
        <div className="p-4 border rounded bg-card">Placeholder chart 2</div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
