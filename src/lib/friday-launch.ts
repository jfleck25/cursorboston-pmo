import type { TaskSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type FridayTask = {
  id: string;
  title: string;
  description: string | null;
  source: TaskSource;
  shippedAt: string;
  githubHtmlUrl: string | null;
  voteCount: number;
  myVote: boolean;
  assignee: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
};

export type FridayLaunchModel = {
  cohortName: string;
  weekTitle: string;
  tasks: FridayTask[];
};

export async function getFridayLaunch(userId: string): Promise<FridayLaunchModel | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      cohortId: true,
      cohort: { select: { id: true, name: true } },
    },
  });
  if (!user?.cohortId || !user.cohort) return null;

  const activeWeek = await prisma.week.findFirst({
    where: { cohortId: user.cohortId, isActive: true },
    orderBy: { sortIndex: "asc" },
  });
  if (!activeWeek) {
    return { cohortName: user.cohort.name, weekTitle: "No active week", tasks: [] };
  }

  const rows = await prisma.task.findMany({
    where: {
      cohortId: user.cohortId,
      weekId: activeWeek.id,
      status: "shipped",
      shippedAt: { not: null },
    },
    orderBy: { shippedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      source: true,
      shippedAt: true,
      githubHtmlUrl: true,
      assignee: { select: { id: true, name: true, image: true } },
      votes: {
        select: { userId: true },
      },
    },
  });

  const tasks: FridayTask[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    source: r.source,
    shippedAt: r.shippedAt!.toISOString(),
    githubHtmlUrl: r.githubHtmlUrl,
    voteCount: r.votes.length,
    myVote: r.votes.some((v) => v.userId === userId),
    assignee: r.assignee,
  }));

  return {
    cohortName: user.cohort.name,
    weekTitle: activeWeek.title,
    tasks,
  };
}
