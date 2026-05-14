import "server-only";

import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { generateObject, NoObjectGeneratedError } from "ai";
import { openai } from "@ai-sdk/openai";
import { prisma } from "@/lib/prisma";
import { SLOT_LLM_SCHEMA_VERSION, SLOT_SYSTEM_PROMPT } from "@/lib/llm-slot-prompt";
import { slotIdeasSchema, type SlotIdea } from "@/lib/llm-slot-schema";

const SPIN_ABORT_MS = 5000;

function computePromptVersionHash(): string {
  return createHash("sha256")
    .update(SLOT_SYSTEM_PROMPT)
    .update("|")
    .update(SLOT_LLM_SCHEMA_VERSION)
    .digest("hex");
}

function resolveModelId(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

let devRatelimitSkipWarned = false;

type RatelimitMode = Ratelimit | "skip" | "production-block";

function getSpinRatelimit(): RatelimitMode {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    return new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "@momentum/slot-llm",
    });
  }
  if (process.env.NODE_ENV === "production") {
    return "production-block";
  }
  if (!devRatelimitSkipWarned) {
    devRatelimitSkipWarned = true;
    console.warn(
      "[llm] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN unset — slot LLM rate limit disabled in development.",
    );
  }
  return "skip";
}

async function logInvocation(input: {
  userId: string;
  promptVersionHash: string;
  model: string;
  ok: boolean;
  errorCode: string | null;
  durationMs: number;
}) {
  await prisma.llmInvocationLog.create({ data: input });
}

export type InvokeSlotLlmIdeasResult =
  | { ok: true; configured: false }
  | { ok: true; configured: true; ideas: SlotIdea[] }
  | { ok: false; error: string };

/**
 * Rate-limited slot LLM spin: strict `generateObject`, 5s abort, Prisma audit row every time
 * OpenAI or Upstash gates are hit (including denials).
 */
export async function invokeSlotLlmIdeas(userId: string): Promise<InvokeSlotLlmIdeasResult> {
  const started = Date.now();
  const hash = computePromptVersionHash();
  const modelId = resolveModelId();

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { ok: true, configured: false };
  }

  const rl = getSpinRatelimit();
  if (rl === "production-block") {
    await logInvocation({
      userId,
      promptVersionHash: hash,
      model: "n/a",
      ok: false,
      errorCode: "ratelimit_unconfigured",
      durationMs: Date.now() - started,
    });
    return { ok: false, error: "Rate limiting is not configured for this deployment." };
  }

  if (rl !== "skip") {
    const { success } = await rl.limit(userId);
    if (!success) {
      await logInvocation({
        userId,
        promptVersionHash: hash,
        model: modelId,
        ok: false,
        errorCode: "rate_limited",
        durationMs: Date.now() - started,
      });
      return { ok: false, error: "Too many AI spins — try again in about a minute." };
    }
  }

  const abortController = new AbortController();
  const deadline = setTimeout(() => abortController.abort(), SPIN_ABORT_MS);

  try {
    const { object } = await generateObject({
      model: openai(modelId),
      schema: slotIdeasSchema,
      system: SLOT_SYSTEM_PROMPT,
      prompt:
        "Return exactly three distinct task ideas a cohort member could ship this week. Each must include title, oneLiner, and suggestedScope as defined by the schema.",
      maxRetries: 0,
      abortSignal: abortController.signal,
    });
    clearTimeout(deadline);
    await logInvocation({
      userId,
      promptVersionHash: hash,
      model: modelId,
      ok: true,
      errorCode: null,
      durationMs: Date.now() - started,
    });
    return { ok: true, configured: true, ideas: object.ideas };
  } catch (e) {
    clearTimeout(deadline);
    let errorCode = "provider_error";
    if (abortController.signal.aborted) {
      errorCode = "aborted";
    } else if (NoObjectGeneratedError.isInstance(e)) {
      errorCode = "schema_error";
    }
    await logInvocation({
      userId,
      promptVersionHash: hash,
      model: modelId,
      ok: false,
      errorCode,
      durationMs: Date.now() - started,
    });
    const message =
      errorCode === "aborted"
        ? "AI request timed out (5s)."
        : NoObjectGeneratedError.isInstance(e)
          ? "AI returned an invalid shape — try again."
          : e instanceof Error
            ? e.message
            : "AI request failed.";
    return { ok: false, error: message };
  }
}
