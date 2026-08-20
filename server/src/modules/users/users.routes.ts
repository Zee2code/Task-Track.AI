import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";

export const usersRouter = Router();

usersRouter.use(authenticate);

// Admin/Manager: all employees. Team Lead: self + direct reports. Employee: self only.
usersRouter.get("/", async (req, res) => {
  const requester = req.user!;

  if (requester.role === "ADMIN") {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, department: true, managerId: true },
      orderBy: { name: "asc" },
    });
    return res.json(users);
  }

  if (requester.role === "TEAM_LEAD") {
    const users = await prisma.user.findMany({
      where: { OR: [{ id: requester.id }, { managerId: requester.id }] },
      select: { id: true, name: true, email: true, role: true, department: true, managerId: true },
      orderBy: { name: "asc" },
    });
    return res.json(users);
  }

  const self = await prisma.user.findUnique({
    where: { id: requester.id },
    select: { id: true, name: true, email: true, role: true, department: true, managerId: true },
  });
  res.json(self ? [self] : []);
});

usersRouter.patch("/:id", authorize("ADMIN"), async (req, res) => {
  const { name, role, department, managerId, isActive } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, role, department, managerId, isActive },
  });
  res.json(user);
});
