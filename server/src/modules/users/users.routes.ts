import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authenticate, authorize, type AuthUser } from "../../middleware/auth.js";

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
  reportingManager: { select: { id: true, employeeName: true } },
} as const;

async function currentEmployee(requester: AuthUser) {
  return prisma.employee.findUnique({ where: { userId: requester.id } });
}

/** Visibility scope: ADMIN sees everyone, TEAM_LEAD sees self + direct reports, EMPLOYEE sees only self. */
function scopeWhere(requester: AuthUser, selfId: string) {
  if (requester.role === "ADMIN") return {};
  if (requester.role === "TEAM_LEAD") {
    return { OR: [{ id: selfId }, { reportingManagerId: selfId }] };
  }
  return { id: selfId };
}

// GET /api/employees?search=&departmentId=&status=active|inactive
employeesRouter.get("/", async (req, res) => {
  const requester = req.user!;
  const self = await currentEmployee(requester);
  if (!self) return res.status(404).json({ error: "Employee profile not found" });

  const { search, departmentId, status } = req.query as Record<string, string | undefined>;

  const where: Record<string, unknown> = { AND: [scopeWhere(requester, self.id)] };
  const and = where.AND as unknown[];

  if (search) {
    and.push({
      OR: [
        { employeeName: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (departmentId) and.push({ departmentId });
  if (status === "active") and.push({ isActive: true });
  if (status === "inactive") and.push({ isActive: false });

  const employees = await prisma.employee.findMany({
    where,
    select: employeeSelect,
    orderBy: { employeeName: "asc" },
  });
  res.json(employees);
});

// GET /api/employees/hierarchy - full org tree (Admin) or subtree rooted at self (Team Lead/Employee)
employeesRouter.get("/hierarchy", async (req, res) => {
  const requester = req.user!;
  const self = await currentEmployee(requester);
  if (!self) return res.status(404).json({ error: "Employee profile not found" });

  const all = await prisma.employee.findMany({
    select: {
      id: true,
      employeeName: true,
      designation: true,
      role: true,
      isActive: true,
      reportingManagerId: true,
      department: { select: { name: true } },
    },
    orderBy: { employeeName: "asc" },
  });

  const byManager = new Map<string | null, typeof all>();
  for (const emp of all) {
    const key = emp.reportingManagerId;
    if (!byManager.has(key)) byManager.set(key, []);
    byManager.get(key)!.push(emp);
  }

  function buildNode(emp: (typeof all)[number]): unknown {
    return { ...emp, subordinates: (byManager.get(emp.id) ?? []).map(buildNode) };
  }

  if (requester.role === "ADMIN") {
    const roots = byManager.get(null) ?? [];
    return res.json(roots.map(buildNode));
  }

  // Team Lead / Employee: subtree rooted at themselves
  const selfFull = all.find((e) => e.id === self.id);
  if (!selfFull) return res.json([]);
  res.json([buildNode(selfFull)]);
});

// GET /api/employees/:id
employeesRouter.get("/:id", async (req, res) => {
  const requester = req.user!;
  const self = await currentEmployee(requester);
  if (!self) return res.status(404).json({ error: "Employee profile not found" });

  const employee = await prisma.employee.findUnique({
    where: { id: req.params.id },
    select: employeeSelect,
  });
  if (!employee) return res.status(404).json({ error: "Employee not found" });

  const allowed =
    requester.role === "ADMIN" ||
    employee.id === self.id ||
    (requester.role === "TEAM_LEAD" && employee.reportingManagerId === self.id);
  if (!allowed) return res.status(403).json({ error: "Forbidden" });

  res.json(employee);
});

const createSchema = z.object({
  employeeName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  designation: z.string().min(1),
  role: z.enum(["ADMIN", "TEAM_LEAD", "EMPLOYEE"]),
  departmentId: z.string().uuid().optional(),
  reportingManagerId: z.string().uuid().optional(),
  phone: z.string().optional(),
  joiningDate: z.coerce.date().optional(),
});

async function nextEmployeeId() {
  const count = await prisma.employee.count();
  return `EMP-${String(count + 1).padStart(4, "0")}`;
}

// POST /api/employees - Admin only: create a new employee (and their login)
employeesRouter.post("/", authorize("ADMIN"), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { employeeName, email, password, designation, role, departmentId, reportingManagerId, phone, joiningDate } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const employeeId = await nextEmployeeId();

  const employee = await prisma.employee.create({
    data: {
      employeeId,
      employeeName,
      designation,
      email,
      phone,
      role,
      department: departmentId ? { connect: { id: departmentId } } : undefined,
      reportingManager: reportingManagerId ? { connect: { id: reportingManagerId } } : undefined,
      joiningDate,
      user: { create: { email, passwordHash, role } },
    },
    select: employeeSelect,
  });

  res.status(201).json(employee);
});

const updateSchema = z.object({
  employeeName: z.string().min(1).optional(),
  designation: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "TEAM_LEAD", "EMPLOYEE"]).optional(),
  departmentId: z.string().uuid().nullable().optional(),
  reportingManagerId: z.string().uuid().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// PATCH /api/employees/:id - Admin only: edit, or activate/deactivate
employeesRouter.patch("/:id", authorize("ADMIN"), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.reportingManagerId === req.params.id) {
    return res.status(400).json({ error: "An employee cannot report to themselves" });
  }

  if (parsed.data.reportingManagerId) {
    const manager = await prisma.employee.findUnique({ where: { id: parsed.data.reportingManagerId } });
    if (!manager || !manager.isActive) {
      return res.status(400).json({ error: "Reporting manager must be an active employee" });
    }
  }

  const existing = await prisma.employee.findUnique({ where: { id: req.params.id }, select: { userId: true } });
  if (!existing) return res.status(404).json({ error: "Employee not found" });

  const employee = await prisma.employee.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: employeeSelect,
  });

  // Keep the auth account's role/active state in sync with the employee record.
  if (parsed.data.role || parsed.data.isActive !== undefined) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: {
        ...(parsed.data.role ? { role: parsed.data.role } : {}),
        ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
      },
    });
  }

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
  if (!name || typeof name !== "string") return res.status(400).json({ error: "name is required" });
  const department = await prisma.department.create({ data: { name } });
  res.status(201).json(department);
});
