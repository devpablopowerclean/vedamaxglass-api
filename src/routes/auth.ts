import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh-secret";

function generateTokens(payload: { id: number; email: string; role: "admin" | "user" }) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: "7d" });
  return { accessToken, refreshToken };
}

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const { email, password } = parsed.data;

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) return res.status(401).json({ error: "Credenciais invalidas" });

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) return res.status(401).json({ error: "Credenciais invalidas" });

  const tokens = generateTokens({ id: admin.id, email: admin.email, role: "admin" });
  return res.json({ user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role }, ...tokens });
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
});

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos", details: parsed.error.issues });

  const { name, email, phone, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: "Email ja cadastrado" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, phone, password: hashed },
  });

  const tokens = generateTokens({ id: user.id, email: user.email, role: "user" });
  return res.status(201).json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    ...tokens,
  });
});

const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login/user", async (req: Request, res: Response) => {
  const parsed = userLoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Dados invalidos" });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "Credenciais invalidas" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Credenciais invalidas" });

  const tokens = generateTokens({ id: user.id, email: user.email, role: "user" });
  return res.json({
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    ...tokens,
  });
});

router.post("/refresh", async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "Refresh token obrigatorio" });

  try {
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { id: number; email: string; role: "admin" | "user" };
    const tokens = generateTokens({ id: payload.id, email: payload.email, role: payload.role });
    return res.json(tokens);
  } catch {
    return res.status(401).json({ error: "Refresh token invalido" });
  }
});

router.get("/me", authenticate, async (req: Request, res: Response) => {
  if (req.user?.role === "admin") {
    const admin = await prisma.admin.findUnique({ where: { id: req.user.id } });
    if (!admin) return res.status(404).json({ error: "Admin nao encontrado" });
    return res.json({ admin: { id: admin.id, name: admin.name, email: admin.email, role: admin.role } });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) return res.status(404).json({ error: "Usuario nao encontrado" });
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: "user" } });
});

export default router;
