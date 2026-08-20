import { useAuth } from "../../lib/auth-context";

export function ProfilePage() {
  const { user } = useAuth();
  const employee = user?.employee;

  return (
    <div>
      <h1 className="font-display text-2xl mb-6">Settings / Profile</h1>
      <div className="max-w-lg rounded-lg border border-neutral-200 bg-white p-6 space-y-4 text-sm">
        <Row label="Employee ID" value={employee?.employeeId ?? "—"} />
        <Row label="Name" value={employee?.employeeName ?? "—"} />
        <Row label="Designation" value={employee?.designation ?? "—"} />
        <Row label="Department" value={employee?.department?.name ?? "—"} />
        <Row label="Email" value={user?.email ?? "—"} />
        <Row label="Phone" value={employee?.phone ?? "—"} />
        <Row label="Role" value={user?.role.replace("_", " ") ?? "—"} />
        <Row
          label="Joining Date"
          value={employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : "—"}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 pb-2">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
