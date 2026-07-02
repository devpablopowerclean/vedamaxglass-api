import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);

  await prisma.admin.upsert({
    where: { email: "admin@vedamaxglass.com.br" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@vedamaxglass.com.br",
      password: adminPassword,
      role: "superadmin",
    },
  });

  await prisma.pageSection.createMany({
    skipDuplicates: true,
    data: [
      { slug: "hero", title: "Hero", active: true, order: 1 },
      { slug: "kpis", title: "KPIs", active: true, order: 2 },
      { slug: "services", title: "Serviços", active: true, order: 3 },
      { slug: "differentials", title: "Diferenciais", active: true, order: 4 },
      { slug: "process", title: "Processo", active: true, order: 5 },
      { slug: "portfolio", title: "Portfólio", active: true, order: 6 },
      { slug: "contact", title: "Contato", active: true, order: 7 },
    ],
  });

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      whatsappNumber: "5511999999999",
      email: "contato@vedamaxglass.com.br",
    },
  });

  console.log("Seed concluido!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
