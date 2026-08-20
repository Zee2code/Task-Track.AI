import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/auth-context";
import { AppShell } from "./app/AppShell";
import { ProtectedRoute } from "./app/ProtectedRoute";
import { LoginPage } from "./features/auth/LoginPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { PlaceholderPage } from "./features/dashboard/PlaceholderPage";
import { EmployeesPage } from "./features/employees/EmployeesPage";
import { ProfilePage } from "./features/settings/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/my-tasks" element={<PlaceholderPage title="My Tasks" />} />
            <Route path="/team-tasks" element={<PlaceholderPage title="Team Tasks" />} />
            <Route path="/operations" element={<PlaceholderPage title="Operations" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports" />} />
            <Route path="/notifications" element={<PlaceholderPage title="Notifications" />} />
            <Route path="/settings" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
