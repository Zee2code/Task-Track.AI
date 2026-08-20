import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { authenticate } from "../../middleware/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  employeeName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  designation: z.string().min(1),
  role: z.enum(["ADMIN", "TEAM_LEAD", "EMPLOYEE"]).optional(),
  departmentId: z.string().uuid().optional(),
  reportingManagerId: z.string().uuid().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueToken(res: import("express").Response, user: { id: string; role: string }) {
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function nextEmployeeId() {
  const count = await prisma.employee.count();
  return `EMP-${String(count + 1).padStart(4, "0")}`;
}

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { employeeName, email, password, designation, role, departmentId, reportingManagerId, phone } =
    parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const employeeId = await nextEmployeeId();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: role ?? "EMPLOYEE",
      employee: {
        create: {
          employeeId,
          employeeName,
          designation,
          email,
          phone,
          role: role ?? "EMPLOYEE",
          departmentId,
          reportingManagerId,
        },
      },
    },
    include: { employee: true },
  });

  issueToken(res, user);
  res.status(201).json({ id: user.id, email: user.email, role: user.role, employee: user.employee });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  issueToken(res, user);
  res.json({ id: user.id, email: user.email, role: user.role });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("token");
  res.status(204).send();
});

authRouter.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      employee: {
        select: {
          id: true,
          employeeId: true,
          employeeName: true,
          designation: true,
          phone: true,
          joiningDate: true,
          department: { select: { id: true, name: true } },
          reportingManagerId: true,
        },
      },
    },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});
