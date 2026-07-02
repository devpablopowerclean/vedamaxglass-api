import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

const schema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  active: z.boolean().optional(),
  order: z.number().optional(),
});

router.get("/", async (_req: Request, res: Response) => {
  const items = await prisma.serviceCard.findMany({ orderBy: { order: "asc" } });
  return res.json(items);
});

router.get("/public", async (_req: Request, res: Response) => {
  const items = await prisma.serviceCard.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return res.json(items);
});

router.post("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const item = await prisma.serviceCard.create({ data: parsed.data });
  return res.status(201).json(item);
});

router.put("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const item = await prisma.serviceCard.update({
    where: { id: Number(req.params.id) },
    data: parsed.data,
  });
  return res.json(item);
});

router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  await prisma.serviceCard.delete({ where: { id: Number(req.params.id) } });
  return res.status(204).end();
});

export default router;
