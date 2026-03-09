import AdminLayout from "@/components/AdminLayout";

const AIMonitor = () => {
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-4">AI Monitor</h1>
      <div className="space-y-4">
        <div className="p-4 border rounded bg-card">Recent AI calls and usage metrics</div>
        <div className="p-4 border rounded bg-card">Error rate: 0.2% (placeholder)</div>
      </div>
    </AdminLayout>
  );
};

export default AIMonitor;
