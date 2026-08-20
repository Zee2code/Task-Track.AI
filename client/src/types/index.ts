export type Role = "ADMIN" | "TEAM_LEAD" | "EMPLOYEE";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string | null;
  managerId: string | null;
}
