"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { logServerEvent } from "@/lib/action-log";
import { notifyDiscordRoll } from "@/lib/discord-webhook";
import { prisma } from "@/lib/prisma";
import { publicAppUrl } from "@/lib/public-url";

const githubPart = z.object({
  githubOwner: z.string().min(1).max(120),
  githubRepo: z.string().min(1).max(120),
  githubIssueNumber: z.number().int().positive(),
  githubNodeId: z.string().max(200).nullable().optional(),
  githubHtmlUrl: z.string().url().max(2000),
  title: z.string().min(1).max(300),
  description: z.string().max(8000).nullable().optional(),
});

const aiPart = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(8000).optional().default(""),
});

const saveSchema = z.discriminatedUnion("source", [
  z.object({
    source: z.literal("github"),
    idempotencyKey: z.string().uuid(),
    github: githubPart,
  }),
  z.object({
    source: z.literal("ai"),
    idempotencyKey: z.string().uuid(),
    ai: aiPart,
  }),
]);

export type SaveSpunTaskResult =
  | { ok: true; taskId: string; deduped: boolean }
  | { ok: false; error: string };

export async function saveSpunTask(raw: unknown): Promise<SaveSpunTaskResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in required." };
  }

  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Invalid payload." };
  }
  const body = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cohortId: true, name: true, email: true },
  });
  if (!user?.cohortId) {
    return { ok: false, error: "No cohort assigned." };
  }

  const activeWeek = await prisma.week.findFirst({
    where: { cohortId: user.cohortId, isActive: true },
    orderBy: { sortIndex: "asc" },
    select: { id: true },
  });

  const base = {
    cohortId: user.cohortId,
    weekId: activeWeek?.id ?? null,
    assigneeUserId: session.user.id,
    status: "incoming" as const,
    idempotencyKey: body.idempotencyKey,
    themeTag: "slot",
  };

  try {
    if (body.source === "github") {
      const g = body.github;
      const task = await prisma.task.create({
        data: {
          ...base,
          source: "github",
          title: g.title,
          description: g.description ?? null,
          githubOwner: g.githubOwner,
          githubRepo: g.githubRepo,
          githubIssueNumber: g.githubIssueNumber,
          githubNodeId: g.githubNodeId ?? null,
          githubHtmlUrl: g.githubHtmlUrl,
          metadata: { slot: "github-quick-win" },
        },
      });
      await fireRollDiscord(user.name ?? user.email ?? "Cohort member", task);
      revalidatePath("/");
      logServerEvent("save_spun_task", { source: "github", ok: "true", deduped: "false" });
      return { ok: true, taskId: task.id, deduped: false };
    }

    const a = body.ai;
    const task = await prisma.task.create({
      data: {
        ...base,
        source: "ai",
        title: a.title,
        description: a.description || null,
        metadata: { slot: "ai-ideas" },
      },
    });
    await fireRollDiscord(user.name ?? user.email ?? "Cohort member", task);
    revalidatePath("/");
    logServerEvent("save_spun_task", { source: "ai", ok: "true", deduped: "false" });
    return { ok: true, taskId: task.id, deduped: false };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const existing = await prisma.task.findFirst({
        where: { idempotencyKey: body.idempotencyKey },
        select: { id: true },
      });
      if (existing) {
        logServerEvent("save_spun_task", { ok: "true", deduped: "true" });
        return { ok: true, taskId: existing.id, deduped: true };
      }
    }
    logServerEvent("save_spun_task", { ok: "false", error: "create_failed" });
    return { ok: false, error: "Could not save task." };
  }
}

async function fireRollDiscord(
  userHandle: string,
  task: { id: string; title: string; source: string },
) {
  const taskUrl = `${publicAppUrl()}/?highlight=${task.id}`;
  await notifyDiscordRoll({
    webhookUrl: process.env.DISCORD_WEBHOOK_ROLL_URL,
    userHandle,
    taskTitle: task.title,
    taskUrl,
    source: task.source === "github" ? "github" : "ai",
  });
}
