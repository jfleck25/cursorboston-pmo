"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toggleVote } from "@/actions/toggle-vote";
import type { FridayTask } from "@/lib/friday-launch";

export function FridayLaunchGrid({
  tasks,
  viewerUserId,
}: {
  tasks: FridayTask[];
  viewerUserId: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <p className="rounded border border-dashed border-surface-border bg-surface-muted/40 p-6 text-sm text-ink-muted">
        No shipped cards for the active week yet. Ship from the assembly line to light up Friday.
      </p>
    );
  }

  return (
    <div className="columns-1 gap-4 space-y-4 sm:columns-2 lg:columns-3">
      {tasks.map((t) => (
        <article
          key={t.id}
          className="mb-4 break-inside-avoid rounded border border-surface-border bg-surface-raised/90 p-4 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.06)]"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-sans text-sm font-semibold leading-snug text-ink">
              {t.githubHtmlUrl ? (
                <Link href={t.githubHtmlUrl} target="_blank" rel="noreferrer" className="hover:text-focus">
                  {t.title}
                </Link>
              ) : (
                t.title
              )}
            </h3>
            <span
              className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                t.source === "github" ? "bg-github/15 text-github" : "bg-ai/15 text-ai"
              }`}
            >
              {t.source}
            </span>
          </div>
          {t.description ? (
            <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-ink-muted">{t.description}</p>
          ) : null}
          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {t.assignee?.image ? (
                <Image
                  src={t.assignee.image}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 rounded border border-surface-border object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded border border-surface-border bg-surface-muted font-mono text-[10px] text-ink-muted">
                  {(t.assignee?.name ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <span className="truncate font-mono text-[10px] text-ink-muted">
                {t.assignee?.name ?? "Cohort"}
              </span>
            </div>
            <span className="font-mono text-[10px] text-ink-muted">
              {new Date(t.shippedAt).toLocaleDateString()}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-surface-border pt-3">
            <span className="font-mono text-[11px] text-ship">
              {t.voteCount} launch {t.voteCount === 1 ? "upvote" : "upvotes"}
            </span>
            {viewerUserId ? (
              <button
                type="button"
                disabled={busy === t.id}
                onClick={() => {
                  setErr(null);
                  setBusy(t.id);
                  void (async () => {
                    const r = await toggleVote(t.id);
                    setBusy(null);
                    if (!r.ok) {
                      setErr(r.error ?? "Vote failed");
                      return;
                    }
                    router.refresh();
                  })();
                }}
                className={`rounded border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wide transition ${
                  t.myVote
                    ? "border-ship bg-ship/20 text-ship"
                    : "border-surface-border text-ink-muted hover:border-focus hover:text-focus"
                }`}
              >
                {t.myVote ? "Upvoted" : "Upvote"}
              </button>
            ) : (
              <span className="font-mono text-[10px] text-ink-muted">Sign in to upvote</span>
            )}
          </div>
        </article>
      ))}
      {err ? <p className="font-mono text-xs text-danger">{err}</p> : null}
    </div>
  );
}
