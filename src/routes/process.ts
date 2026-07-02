import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  stepNumber: z.number(),
  active: z.boolean().optional(),
});

router.get("/", async (_req: Request, res: Response) => {
  const items = await prisma.processStep.findMany({ orderBy: { stepNumber: "asc" } });
  return res.json(items);
});

router.get("/public", async (_req: Request, res: Response) => {
  const items = await prisma.processStep.findMany({
    where: { active: true },
    orderBy: { stepNumber: "asc" },
  });
  return res.json(items);
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });
  const item = await prisma.processStep.create({ data: parsed.data });
  return res.status(201).json(item);
});

router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });
  const item = await prisma.processStep.update({
    where: { id: Number(req.params.id) },
    data: parsed.data,
  });
  return res.json(item);
});

router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  await prisma.processStep.delete({ where: { id: Number(req.params.id) } });
  return res.status(204).end();
});

export default router;
