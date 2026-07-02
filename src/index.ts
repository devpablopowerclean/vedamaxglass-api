import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import sectionsRoutes from "./routes/sections.js";
import servicesRoutes from "./routes/services.js";
import portfolioRoutes from "./routes/portfolio.js";
import processRoutes from "./routes/process.js";
import kpisRoutes from "./routes/kpis.js";
import differentialsRoutes from "./routes/differentials.js";
import settingsRoutes from "./routes/settings.js";
import leadsRoutes from "./routes/leads.js";
import projectsRoutes from "./routes/projects.js";
import usersRoutes from "./routes/users.js";
import uploadRoutes from "./routes/upload.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://vedamaxglass.com.br",
    /\.onrender\.com$/,
    /\.vercel\.app$/,
  ],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/sections", sectionsRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/process", processRoutes);
app.use("/api/kpis", kpisRoutes);
app.use("/api/differentials", differentialsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/leads", leadsRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
