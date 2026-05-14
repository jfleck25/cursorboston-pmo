"use server";

import { auth } from "@/auth";
import { fetchQuickWinGithubIssues } from "@/lib/github-app-issues";
import type { GithubIssueCandidate } from "@/lib/github-app-types";

export type PrefetchGithubQuickWinsResult =
  | { ok: true; anonymous: true }
  | { ok: true; configured: false }
  | { ok: true; configured: true; candidates: GithubIssueCandidate[]; partialErrors: string[] }
  | { ok: false; error: string };

/**
 * Authenticated prefetch for the slot machine GitHub reel. Anonymous callers
 * get a fast no-op so the lever stays usable without burning API quota.
 */
export async function prefetchGithubQuickWins(): Promise<PrefetchGithubQuickWinsResult> {
  const session = await auth();
  console.log("[github-app] session user id:", session?.user?.id || "NONE");
  if (!session?.user?.id) {
    return { ok: true, anonymous: true };
  }

  try {
    const { configured, issues, partialErrors } = await fetchQuickWinGithubIssues();
    if (!configured) {
      return { ok: true, configured: false };
    }
    return {
      ok: true,
      configured: true,
      candidates: issues,
      partialErrors,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "GitHub App request failed.";
    console.warn("[github-app] prefetch failed");
    return { ok: false, error: message };
  }
}
