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

export interface Department {
  id: string;
  name: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  email: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  joiningDate: string;
  department: Department | null;
  reportingManagerId: string | null;
  reportingManager: { id: string; employeeName: string } | null;
}

export interface HierarchyNode {
  id: string;
  employeeName: string;
  designation: string;
  role: Role;
  isActive: boolean;
  reportingManagerId: string | null;
  department: { name: string } | null;
  subordinates: HierarchyNode[];
}
