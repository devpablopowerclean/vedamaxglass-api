import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

const updateSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional().nullable(),
  content: z.any().optional(),
  images: z.any().optional(),
  active: z.boolean().optional(),
  order: z.number().optional(),
});

router.get("/", async (_req: Request, res: Response) => {
  const sections = await prisma.pageSection.findMany({ orderBy: { order: "asc" } });
  return res.json(sections);
});

router.get("/public", async (_req: Request, res: Response) => {
  const sections = await prisma.pageSection.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return res.json(sections);
});

router.get("/:slug", async (req: Request, res: Response) => {
  const slug = req.params.slug as string;
  const section = await prisma.pageSection.findUnique({ where: { slug } });
  if (!section) return res.status(404).json({ error: "Secao nao encontrada" });
  return res.json(section);
});

router.put("/:slug", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const section = await prisma.pageSection.update({
    where: { slug: req.params.slug as string },
    data: parsed.data,
  });
  return res.json(section);
});

export default router;
