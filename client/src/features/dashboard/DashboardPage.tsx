import { useAuth } from "../../lib/auth-context";

export function DashboardPage() {
  const { user } = useAuth();
  return (
    <div>
      <h1 className="font-display text-2xl mb-1">Welcome back, {user?.name}</h1>
      <p className="text-neutral-500 mb-6">{user?.role.replace("_", " ")} overview</p>
      <div className="rounded-lg border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        Foundation scaffold — module content lands in the next stage.
      </div>
    </div>
  );
}
