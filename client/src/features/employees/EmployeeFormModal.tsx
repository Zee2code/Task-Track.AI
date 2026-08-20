import { useState, type FormEvent } from "react";
import { api } from "../../lib/api";
import type { Department, Employee, Role } from "../../types";

interface Props {
  employee: Employee | null;
  departments: Department[];
  managerOptions: Employee[];
  onClose: () => void;
  onSaved: () => void;
}

export function EmployeeFormModal({ employee, departments, managerOptions, onClose, onSaved }: Props) {
  const isEdit = Boolean(employee);

  const [employeeName, setEmployeeName] = useState(employee?.employeeName ?? "");
  const [email, setEmail] = useState(employee?.email ?? "");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState(employee?.designation ?? "");
  const [role, setRole] = useState<Role>(employee?.role ?? "EMPLOYEE");
  const [departmentId, setDepartmentId] = useState(employee?.department?.id ?? "");
  const [reportingManagerId, setReportingManagerId] = useState(employee?.reportingManagerId ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isEdit && employee) {
        await api.patch(`/employees/${employee.id}`, {
          employeeName,
          designation,
          role,
          departmentId: departmentId || null,
          reportingManagerId: reportingManagerId || null,
          phone: phone || null,
        });
      } else {
        await api.post("/employees", {
          employeeName,
          email,
          password,
          designation,
          role,
          departmentId: departmentId || undefined,
          reportingManagerId: reportingManagerId || undefined,
          phone: phone || undefined,
        });
      }
      onSaved();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "Could not save employee.";
      setError(typeof message === "string" ? message : "Could not save employee.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="font-display text-xl mb-4">{isEdit ? "Edit Employee" : "Add Employee"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Employee Name">
              <input
                required
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Designation">
              <input required value={designation} onChange={(e) => setDesignation(e.target.value)} className="input" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <input
                type="email"
                required
                disabled={isEdit}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input disabled:bg-neutral-100 disabled:text-neutral-400"
              />
            </Field>
            <Field label="Phone">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </Field>
          </div>

          {!isEdit && (
            <Field label="Temporary Password">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className="input">
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Role">
              <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input">
                <option value="EMPLOYEE">Employee</option>
                <option value="TEAM_LEAD">Team Lead / Senior Employee</option>
                <option value="ADMIN">Admin / Manager</option>
              </select>
            </Field>
          </div>

          <Field label="Reporting Manager">
            <select
              value={reportingManagerId}
              onChange={(e) => setReportingManagerId(e.target.value)}
              className="input"
            >
              <option value="">None (top of hierarchy)</option>
              {managerOptions
                .filter((m) => m.id !== employee?.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.employeeName} — {m.designation}
                  </option>
                ))}
            </select>
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-brand-black text-brand-cream px-4 py-2 text-sm font-medium hover:bg-brand-gold hover:text-brand-black transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm mb-1 text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
