import { Router, Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import { authenticate, requireAdmin } from "../middleware/auth.js";

const router = Router();
const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Formato de arquivo nao suportado"));
    }
  },
});

router.post("/", authenticate, requireAdmin, upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "Arquivo obrigatorio" });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const outputPath = path.join(UPLOAD_DIR, filename);

  if (req.file.mimetype === "image/svg+xml") {
    await fs.writeFile(outputPath, req.file.buffer);
  } else {
    await sharp(req.file.buffer)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputPath.replace(ext, ".webp"));

    const webpFilename = filename.replace(ext, ".webp");
    return res.json({ url: `/uploads/${webpFilename}` });
  }

  return res.json({ url: `/uploads/${filename}` });
});

export default router;
