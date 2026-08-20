import type { Employee } from "../../types";

export function EmployeeDetailDrawer({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md bg-white shadow-xl p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-xl">{employee.employeeName}</h2>
            <p className="text-sm text-neutral-500">{employee.designation}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-brand-black text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <Row label="Employee ID" value={employee.employeeId} />
          <Row label="Email" value={employee.email} />
          <Row label="Phone" value={employee.phone ?? "—"} />
          <Row label="Department" value={employee.department?.name ?? "—"} />
          <Row label="Reporting Manager" value={employee.reportingManager?.employeeName ?? "—"} />
          <Row label="Role" value={employee.role.replace("_", " ")} />
          <Row
            label="Status"
            value={
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  employee.isActive ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
                }`}
              >
                {employee.isActive ? "Active" : "Inactive"}
              </span>
            }
          />
          <Row label="Joining Date" value={new Date(employee.joiningDate).toLocaleDateString()} />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 pb-2">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
