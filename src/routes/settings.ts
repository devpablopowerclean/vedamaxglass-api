import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();

const schema = z.object({
  whatsappNumber: z.string().optional(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  googleAnalytics: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  favicon: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
});

router.get("/", async (_req: Request, res: Response) => {
  let settings = await prisma.siteSetting.findFirst();
  if (!settings) {
    settings = await prisma.siteSetting.create({ data: {} });
  }
  return res.json(settings);
});

router.put("/", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  let settings = await prisma.siteSetting.findFirst();
  if (!settings) {
    settings = await prisma.siteSetting.create({ data: parsed.data });
  } else {
    settings = await prisma.siteSetting.update({
      where: { id: settings.id },
      data: parsed.data,
    });
  }
  return res.json(settings);
});

export default router;
