import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, phone: true, createdAt: true, _count: { select: { projects: true, leads: true } } },
  });
  return res.json(users);
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  if (req.user!.role !== "user") return res.status(403).json({ error: "Rota para clientes" });

  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, phone: true, address: true, createdAt: true },
  });
  return res.json(user);
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  password: z.string().min(6).optional(),
});

router.put("/me", authenticate, async (req: Request, res: Response) => {
  if (req.user!.role !== "user") return res.status(403).json({ error: "Rota para clientes" });

  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const data: any = { ...parsed.data };
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id: req.user!.id },
    data,
    select: { id: true, name: true, email: true, phone: true, address: true },
  });
  return res.json(user);
});

router.get("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    select: { id: true, name: true, email: true, phone: true, address: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: "Usuario nao encontrado" });
  return res.json(user);
});

export default router;
