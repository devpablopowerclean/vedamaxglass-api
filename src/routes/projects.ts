import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional().nullable(),
  status: z.enum(["budget", "scheduled", "executing", "completed"]).optional(),
  photos: z.any().optional(),
  files: z.any().optional(),
});

router.get("/", authenticate, async (req: Request, res: Response) => {
  if (req.user!.role === "admin") {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return res.json(projects);
  }

  const projects = await prisma.project.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  return res.json(projects);
});

router.post("/", authenticate, async (req: Request, res: Response) => {
  if (req.user!.role !== "user") return res.status(403).json({ error: "Apenas clientes podem criar projetos" });

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const project = await prisma.project.create({
    data: { ...parsed.data, userId: req.user!.id },
  });
  return res.status(201).json(project);
});

router.get("/:id", authenticate, async (req: Request, res: Response) => {
  const project = await prisma.project.findUnique({ where: { id: Number(req.params.id) } });
  if (!project) return res.status(404).json({ error: "Projeto nao encontrado" });
  if (req.user!.role !== "admin" && project.userId !== req.user!.id) {
    return res.status(403).json({ error: "Acesso negado" });
  }
  return res.json(project);
});

router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const project = await prisma.project.update({
    where: { id: Number(req.params.id) },
    data: parsed.data,
  });
  return res.json(project);
});

export default router;
