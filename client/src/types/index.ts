export type Role = "ADMIN" | "TEAM_LEAD" | "EMPLOYEE";

export interface EmployeeProfile {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  phone: string | null;
  joiningDate: string;
  department: { id: string; name: string } | null;
  reportingManagerId: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employee: EmployeeProfile | null;
}
