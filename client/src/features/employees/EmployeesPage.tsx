import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth-context";
import type { Department, Employee } from "../../types";
import { EmployeeFormModal } from "./EmployeeFormModal";
import { EmployeeDetailDrawer } from "./EmployeeDetailDrawer";
import { OrgChart } from "./OrgChart";

type Tab = "list" | "hierarchy";

export function EmployeesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [tab, setTab] = useState<Tab>("list");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState<"" | "active" | "inactive">("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);

  async function loadEmployees() {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (departmentId) params.departmentId = departmentId;
      if (status) params.status = status;
      const { data } = await api.get<Employee[]>("/employees", { params });
      setEmployees(data);
    } catch {
      setError("Failed to load employees.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get<Department[]>("/departments").then(({ data }) => setDepartments(data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(loadEmployees, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, departmentId, status]);

  const managerOptions = useMemo(() => employees.filter((e) => e.isActive), [employees]);

  async function handleToggleActive(employee: Employee) {
    await api.patch(`/employees/${employee.id}`, { isActive: !employee.isActive });
    loadEmployees();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl mb-1">Employees</h1>
          <p className="text-sm text-neutral-500">
            {isAdmin ? "Full organization directory" : "You and your direct reports"}
          </p>
        </div>
        {isAdmin && tab === "list" && (
          <button
            onClick={() => {
              setEditingEmployee(null);
              setFormOpen(true);
            }}
            className="rounded-md bg-brand-black text-brand-cream px-4 py-2 text-sm font-medium hover:bg-brand-gold hover:text-brand-black transition-colors"
          >
            + Add Employee
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-neutral-200">
        <button
          onClick={() => setTab("list")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "list" ? "border-brand-gold text-brand-black" : "border-transparent text-neutral-500"
          }`}
        >
          Directory
        </button>
        <button
          onClick={() => setTab("hierarchy")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === "hierarchy" ? "border-brand-gold text-brand-black" : "border-transparent text-neutral-500"
          }`}
        >
          Org Hierarchy
        </button>
      </div>

      {tab === "list" ? (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            <input
              type="text"
              placeholder="Search by name, ID, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-[220px] rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            />
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-4 py-3 font-medium">Employee ID</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Designation</th>
                  <th className="px-4 py-3 font-medium">Department</th>
                  <th className="px-4 py-3 font-medium">Reporting Manager</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                      Loading...
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-neutral-400">
                      No employees found.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                      <td className="px-4 py-3 font-mono text-xs text-neutral-500">{emp.employeeId}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          className="font-medium text-brand-black hover:text-brand-gold hover:underline text-left"
                        >
                          {emp.employeeName}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">{emp.designation}</td>
                      <td className="px-4 py-3 text-neutral-600">{emp.department?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-neutral-600">{emp.reportingManager?.employeeName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs">
                          {emp.role.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            emp.isActive ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"
                          }`}
                        >
                          {emp.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditingEmployee(emp);
                                setFormOpen(true);
                              }}
                              className="text-xs text-brand-black hover:text-brand-gold font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleActive(emp)}
                              className="text-xs text-brand-black hover:text-brand-gold font-medium"
                            >
                              {emp.isActive ? "Deactivate" : "Activate"}
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <OrgChart />
      )}

      {formOpen && (
        <EmployeeFormModal
          employee={editingEmployee}
          departments={departments}
          managerOptions={managerOptions}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            loadEmployees();
          }}
        />
      )}

      {viewingEmployee && (
        <EmployeeDetailDrawer employee={viewingEmployee} onClose={() => setViewingEmployee(null)} />
      )}
    </div>
  );
}
