import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth-context";
import type { Role } from "../types";

interface NavItem {
  label: string;
  to: string;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Employees", to: "/employees", roles: ["ADMIN", "TEAM_LEAD"] },
  { label: "My Tasks", to: "/my-tasks" },
  { label: "Team Tasks", to: "/team-tasks", roles: ["ADMIN", "TEAM_LEAD"] },
  { label: "Operations", to: "/operations" },
  { label: "Reports", to: "/reports", roles: ["ADMIN", "TEAM_LEAD"] },
  { label: "Notifications", to: "/notifications" },
  { label: "Settings", to: "/settings" },
];

export function AppShell() {
  const { user, logout } = useAuth();

  const items = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <div className="min-h-screen flex bg-brand-cream">
      <aside className="w-60 shrink-0 bg-brand-black text-brand-cream flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="font-display text-lg tracking-wide">Unzè London</p>
          <p className="text-xs text-brand-gold-light">Ops Dashboard</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-brand-gold text-brand-black font-medium" : "hover:bg-white/10"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-white/10 text-xs">
          <p className="font-medium">{user?.employee?.employeeName ?? user?.email}</p>
          <p className="text-brand-gold-light">{user?.role}</p>
          <button onClick={logout} className="mt-2 text-brand-gold-light hover:text-white">
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
