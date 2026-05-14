"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { logServerEvent } from "@/lib/action-log";
import { notifyDiscordShip } from "@/lib/discord-webhook";
import { prisma } from "@/lib/prisma";
import { publicAppUrl } from "@/lib/public-url";
import { resolveStreakUpdateForShip } from "@/lib/streak-ship";

export type ShipTaskResult =
  | { ok: true; alreadyShipped?: boolean }
  | { ok: false; error: string };

export async function shipTask(taskId: string): Promise<ShipTaskResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in required." };
  }

  const actorId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const actor = await tx.user.findUnique({
        where: { id: actorId },
        select: {
          cohortId: true,
          cohort: { select: { timezone: true } },
          currentStreak: true,
          highestStreak: true,
          lastStreakIncrementLocalDate: true,
          name: true,
          email: true,
        },
      });
      if (!actor?.cohortId || !actor.cohort) {
        return { type: "error" as const, error: "No cohort." };
      }

      const task = await tx.task.findFirst({
        where: { id: taskId, cohortId: actor.cohortId },
        select: {
          id: true,
          title: true,
          status: true,
          githubHtmlUrl: true,
        },
      });
      if (!task) {
        return { type: "error" as const, error: "Task not found." };
      }
      if (task.status === "shipped") {
        return { type: "already" as const };
      }

      const now = new Date();
      await tx.task.update({
        where: { id: taskId },
        data: { status: "shipped", shippedAt: now },
      });

      const { streak, lastShipAt } = await resolveStreakUpdateForShip({
        tx,
        actorUserId: actorId,
        cohortTimezone: actor.cohort.timezone,
        now,
        before: {
          currentStreak: actor.currentStreak,
          highestStreak: actor.highestStreak,
          lastStreakIncrementLocalDate: actor.lastStreakIncrementLocalDate,
        },
      });

      await tx.shipEvent.create({
        data: {
          taskId: task.id,
          userId: actorId,
          shippedAt: now,
        },
      });

      await tx.user.update({
        where: { id: actorId },
        data: {
          currentStreak: streak.currentStreak,
          highestStreak: streak.highestStreak,
          lastStreakIncrementLocalDate: streak.lastStreakIncrementLocalDate,
          lastShipAt,
        },
      });

      return {
        type: "ok" as const,
        taskTitle: task.title,
        momentumUrl: `${publicAppUrl()}/?highlight=${task.id}`,
        externalUrl: task.githubHtmlUrl,
        shippedAtIso: now.toISOString(),
        userHandle: actor.name ?? actor.email ?? "Cohort member",
      };
    });

    if (result.type === "error") {
      return { ok: false, error: result.error };
    }
    if (result.type === "already") {
      return { ok: true, alreadyShipped: true };
    }

    void notifyDiscordShip({
      webhookUrl: process.env.DISCORD_WEBHOOK_SHIP_URL,
      userHandle: result.userHandle,
      taskTitle: result.taskTitle,
      taskUrl: result.externalUrl ?? result.momentumUrl,
      shippedAtIso: result.shippedAtIso,
    });

    revalidatePath("/");
    revalidatePath("/friday");
    logServerEvent("ship_task", { ok: "true", taskId });
    return { ok: true };
  } catch {
    logServerEvent("ship_task", { ok: "false", error: "tx_failed" });
    return { ok: false, error: "Ship failed." };
  }
}
