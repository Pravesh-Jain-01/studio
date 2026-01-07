export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome to the admin area. Here you can manage your store.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-secondary rounded-lg">
            <h2 className="font-bold text-xl">Users</h2>
            <p className="text-muted-foreground mt-1">View and manage users.</p>
        </div>
        <div className="p-6 bg-secondary rounded-lg">
            <h2 className="font-bold text-xl">Orders</h2>
            <p className="text-muted-foreground mt-1">View and manage all orders.</p>
        </div>
        <div className="p-6 bg-secondary rounded-lg">
            <h2 className="font-bold text-xl">Products</h2>
            <p className="text-muted-foreground mt-1">Add, edit, and remove products.</p>
        </div>
      </div>
    </div>
  );
}
