import { PrismaClient, TaskSource, TaskStatus } from "@prisma/client";

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

  let week =
    active ??
    (await prisma.week.create({
      data: {
        cohortId: cohort.id,
        title: "Week 1 — Project Management",
        startsAt: weekStart,
        endsAt: weekEnd,
        isActive: true,
        sortIndex: 0,
      },
    }));

  const demoCount = await prisma.task.count({ where: { cohortId: cohort.id } });
  if (demoCount === 0) {
    await prisma.task.createMany({
      data: [
        {
          cohortId: cohort.id,
          weekId: week.id,
          title: "Wire slot prefetch + idempotent save",
          description: "Promise.allSettled for GitHub + LLM; client UUID idempotency key.",
          source: TaskSource.github,
          status: TaskStatus.in_progress,
          themeTag: "shipping",
          githubOwner: "octokit",
          githubRepo: "rest.js",
          githubIssueNumber: 1,
          githubHtmlUrl: "https://github.com/octokit/rest.js/issues/1",
        },
        {
          cohortId: cohort.id,
          weekId: week.id,
          title: "Radar blip motion + reduced path",
          description: "Keep radar legible on #0F1115; respect cohort non-competitive rule.",
          source: TaskSource.ai,
          status: TaskStatus.incoming,
          themeTag: "ux",
        },
        {
          cohortId: cohort.id,
          weekId: week.id,
          title: "Fuel gauge copy + stretch target",
          description: "Document shipped/week ratio vs cohort stretch constant.",
          source: TaskSource.ai,
          status: TaskStatus.shipped,
          themeTag: "docs",
          shippedAt: new Date(),
        },
        {
          cohortId: cohort.id,
          weekId: null,
          title: "Backlog: Discord ship embed",
          description: "Queue-friendly webhook utility with rotation story.",
          source: TaskSource.github,
          status: TaskStatus.incoming,
          themeTag: "integrations",
          githubHtmlUrl: "https://github.com/vercel/next.js/issues/1",
        },
      ],
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
