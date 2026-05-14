"use server";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { logServerEvent } from "@/lib/action-log";
import { prisma } from "@/lib/prisma";

let devVoteSkipWarned = false;

function getVoteRatelimit(): Ratelimit | "skip" | "production-block" {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    return new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(40, "60 s"),
      prefix: "@momentum/vote",
    });
  }
  if (process.env.NODE_ENV === "production") {
    return "production-block";
  }
  if (!devVoteSkipWarned) {
    devVoteSkipWarned = true;
    console.warn(
      "[vote] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN unset — vote rate limit disabled in development.",
    );
  }
  return "skip";
}

export async function toggleVote(taskId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in required." };
  }

  const rl = getVoteRatelimit();
  if (rl === "production-block") {
    return { ok: false, error: "Voting unavailable." };
  }
  if (rl !== "skip") {
    const { success } = await rl.limit(session.user.id);
    if (!success) {
      logServerEvent("vote", { ok: "false", reason: "rate_limited" });
      return { ok: false, error: "Slow down on upvotes." };
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { cohortId: true },
  });
  if (!user?.cohortId) {
    return { ok: false, error: "No cohort." };
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, cohortId: user.cohortId, status: "shipped" },
    select: { id: true },
  });
  if (!task) {
    return { ok: false, error: "Task not found or not shipped." };
  }

  const existing = await prisma.vote.findUnique({
    where: {
      userId_taskId: { userId: session.user.id, taskId },
    },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
  } else {
    await prisma.vote.create({
      data: { userId: session.user.id, taskId },
    });
  }

  revalidatePath("/friday");
  logServerEvent("vote", { ok: "true", toggled: existing ? "off" : "on" });
  return { ok: true };
}
