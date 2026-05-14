"use server";

import {
  prefetchGithubQuickWins,
  type PrefetchGithubQuickWinsResult,
} from "@/actions/github-quick-wins";
import { prefetchSlotLlmIdeas, type PrefetchSlotLlmIdeasResult } from "@/actions/slot-llm";

export type PrefetchSlotBundleResult = {
  github: PrefetchGithubQuickWinsResult;
  llm: PrefetchSlotLlmIdeasResult;
};

/**
 * Runs GitHub + LLM prefetches with `Promise.allSettled` so one rejection cannot
 * cancel the other reel's work.
 */
export async function prefetchSlotBundle(): Promise<PrefetchSlotBundleResult> {
  const [ghSettled, llmSettled] = await Promise.allSettled([
    prefetchGithubQuickWins(),
    prefetchSlotLlmIdeas(),
  ]);

  const github: PrefetchGithubQuickWinsResult =
    ghSettled.status === "fulfilled"
      ? ghSettled.value
      : { ok: false, error: ghSettled.reason instanceof Error ? ghSettled.reason.message : "GitHub prefetch failed" };

  const llm: PrefetchSlotLlmIdeasResult =
    llmSettled.status === "fulfilled"
      ? llmSettled.value
      : { ok: false, error: llmSettled.reason instanceof Error ? llmSettled.reason.message : "LLM prefetch failed" };

  return { github, llm };
}
