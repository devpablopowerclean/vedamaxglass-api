import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  source: z.string().optional(),
});

router.post("/", async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const lead = await prisma.lead.create({ data: parsed.data });
  return res.status(201).json(lead);
});

router.get("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const { read } = req.query;
  const where = read !== undefined ? { read: read === "true" } : {};
  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  return res.json(leads);
});

router.patch("/:id/read", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const lead = await prisma.lead.update({
    where: { id: Number(req.params.id) },
    data: { read: true },
  });
  return res.json(lead);
});

router.delete("/:id", authenticate, requireAdmin, async (req: Request, res: Response) => {
  await prisma.lead.delete({ where: { id: Number(req.params.id) } });
  return res.status(204).end();
});

export default router;
