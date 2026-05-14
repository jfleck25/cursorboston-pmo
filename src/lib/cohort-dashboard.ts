import type { TaskSource, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DashboardTask = {
  id: string;
  title: string;
  description: string | null;
  source: TaskSource;
  status: TaskStatus;
  themeTag: string | null;
  weekId: string | null;
  assigneeUserId: string | null;
  shippedAt: string | null;
  githubHtmlUrl: string | null;
  assignee: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
};

export type DashboardMember = {
  id: string;
  name: string | null;
  image: string | null;
};

export type ActiveWeek = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
};

export type CohortDashboard = {
  cohortName: string;
  activeWeek: ActiveWeek | null;
  tasks: DashboardTask[];
  members: DashboardMember[];
  /** Active-week tasks shipped ÷ active-week task count × 100 (0 if no week tasks). */
  fuelPercent: number;
  weekTaskCount: number;
  weekShippedCount: number;
};

function serializeTask(row: {
  id: string;
  title: string;
  description: string | null;
  source: TaskSource;
  status: TaskStatus;
  themeTag: string | null;
  weekId: string | null;
  assigneeUserId: string | null;
  shippedAt: Date | null;
  githubHtmlUrl: string | null;
  assignee: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
}): DashboardTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    source: row.source,
    status: row.status,
    themeTag: row.themeTag,
    weekId: row.weekId,
    assigneeUserId: row.assigneeUserId,
    shippedAt: row.shippedAt?.toISOString() ?? null,
    githubHtmlUrl: row.githubHtmlUrl,
    assignee: row.assignee,
  };
}

export async function getCohortDashboard(userId: string): Promise<CohortDashboard | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      cohortId: true,
      cohort: { select: { id: true, name: true } },
    },
  });

  if (!user?.cohortId || !user.cohort) return null;

  const activeWeekRow = await prisma.week.findFirst({
    where: { cohortId: user.cohortId, isActive: true },
    orderBy: { sortIndex: "asc" },
  });

  const activeWeek: ActiveWeek | null = activeWeekRow
    ? {
        id: activeWeekRow.id,
        title: activeWeekRow.title,
        startsAt: activeWeekRow.startsAt.toISOString(),
        endsAt: activeWeekRow.endsAt.toISOString(),
      }
    : null;

  const weekId = activeWeek?.id;

  const taskRows = await prisma.task.findMany({
    where: {
      cohortId: user.cohortId,
      OR: weekId ? [{ weekId }, { weekId: null }] : [{ weekId: null }],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      source: true,
      status: true,
      themeTag: true,
      weekId: true,
      assigneeUserId: true,
      shippedAt: true,
      githubHtmlUrl: true,
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  const members = await prisma.user.findMany({
    where: { cohortId: user.cohortId },
    select: { id: true, name: true, image: true },
    orderBy: { createdAt: "asc" },
  });

  const tasks = taskRows.map(serializeTask);

  const weekTasks = weekId ? tasks.filter((t) => t.weekId === weekId) : [];
  const weekShipped = weekTasks.filter((t) => t.status === "shipped").length;
  const weekTotal = weekTasks.length;

  const fuelPercent =
    weekTotal === 0 ? 0 : Math.min(100, Math.round((100 * weekShipped) / weekTotal));

  return {
    cohortName: user.cohort.name,
    activeWeek,
    tasks,
    members,
    fuelPercent,
    weekTaskCount: weekTotal,
    weekShippedCount: weekShipped,
  };
}
