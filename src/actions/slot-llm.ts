"use server";

import { auth } from "@/auth";
import { invokeSlotLlmIdeas } from "@/lib/llm-slot-spin";
import type { SlotIdea } from "@/lib/llm-slot-schema";

export type PrefetchSlotLlmIdeasResult =
  | { ok: true; anonymous: true }
  | { ok: true; configured: false }
  | { ok: true; configured: true; ideas: SlotIdea[] }
  | { ok: false; error: string };

export async function prefetchSlotLlmIdeas(): Promise<PrefetchSlotLlmIdeasResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: true, anonymous: true };
  }
  try {
    const out = await invokeSlotLlmIdeas(session.user.id);
    if (!out.ok) {
      return { ok: false, error: out.error };
    }
    if (!out.configured) {
      return { ok: true, configured: false };
    }
    return { ok: true, configured: true, ideas: out.ideas };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected server error.";
    console.warn("[llm] prefetchSlotLlmIdeas failed");
    return { ok: false, error: message };
  }
}
