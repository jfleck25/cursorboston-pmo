import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setUTCDate(now.getUTCDate() - now.getUTCDay() + 1);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 7);

  const cohort = await prisma.cohort.upsert({
    where: { slug: "cursor-boston" },
    create: {
      slug: "cursor-boston",
      name: "Cursor Boston Cohort",
      timezone: "America/Chicago",
    },
    update: {},
  });

  const active = await prisma.week.findFirst({
    where: { cohortId: cohort.id, isActive: true },
  });

  if (!active) {
    await prisma.week.create({
      data: {
        cohortId: cohort.id,
        title: "Week 1 — Foundation",
        startsAt: weekStart,
        endsAt: weekEnd,
        isActive: true,
        sortIndex: 0,
      },
    });
  }

  console.log("Seeded cohort + active week:", cohort.slug);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
