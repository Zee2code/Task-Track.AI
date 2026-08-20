import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";

export const employeesRouter = Router();

employeesRouter.use(authenticate);

const employeeSelect = {
  id: true,
  employeeId: true,
  employeeName: true,
  designation: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  joiningDate: true,
  department: { select: { id: true, name: true } },
  reportingManagerId: true,
} as const;

// Admin/Manager: all employees. Team Lead: self + direct reports. Employee: self only.
employeesRouter.get("/", async (req, res) => {
  const requester = req.user!;
  const self = await prisma.employee.findUnique({ where: { userId: requester.id } });
  if (!self) return res.status(404).json({ error: "Employee profile not found" });

  if (requester.role === "ADMIN") {
    const employees = await prisma.employee.findMany({
      select: employeeSelect,
      orderBy: { employeeName: "asc" },
    });
    return res.json(employees);
  }

  if (requester.role === "TEAM_LEAD") {
    const employees = await prisma.employee.findMany({
      where: { OR: [{ id: self.id }, { reportingManagerId: self.id }] },
      select: employeeSelect,
      orderBy: { employeeName: "asc" },
    });
    return res.json(employees);
  }

  const employee = await prisma.employee.findUnique({ where: { id: self.id }, select: employeeSelect });
  res.json(employee ? [employee] : []);
});

employeesRouter.patch("/:id", authorize("ADMIN"), async (req, res) => {
  const { employeeName, designation, role, departmentId, reportingManagerId, phone, isActive } = req.body;
  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: { employeeName, designation, role, departmentId, reportingManagerId, phone, isActive },
  });
  res.json(employee);
});

export const departmentsRouter = Router();
departmentsRouter.use(authenticate);

departmentsRouter.get("/", async (_req, res) => {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  res.json(departments);
});

departmentsRouter.post("/", authorize("ADMIN"), async (req, res) => {
  const { name } = req.body;
  const department = await prisma.department.create({ data: { name } });
  res.status(201).json(department);
});
