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
          className="mb-4 break-inside-avoid rounded border border-surface-border bg-surface-container-high p-5 shadow-lg transition hover:border-surface-border/80"
        >
          <div className="flex items-start gap-4">
            {t.assignee?.image ? (
              <Image
                src={t.assignee.image}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded border border-surface-border object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-surface-border bg-surface-muted font-mono text-xs text-ink-muted">
                {(t.assignee?.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-sans text-lg font-bold truncate text-ink">
                  {t.title}
                </h3>
                {t.voteCount > 0 && (
                  <span className="shrink-0 rounded bg-surface/80 px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest text-ink">
                    RANK #1
                  </span>
                )}
              </div>
              {t.githubHtmlUrl ? (
                <Link href={t.githubHtmlUrl} target="_blank" rel="noreferrer" className="font-mono text-[11px] text-focus hover:underline truncate block max-w-full">
                  {t.githubHtmlUrl.replace("https://", "")}
                </Link>
              ) : (
                <span className="font-mono text-[11px] text-ink-muted">Momentum / {t.source}</span>
              )}
            </div>
          </div>

          <div className="mt-4 rounded border border-focus/30 bg-[#161c26]/50 p-4">
            <p className="text-sm leading-relaxed text-ink-muted">
              {t.description || "No description provided."}
            </p>
          </div>

          <div className="mt-5 flex items-center justify-between">
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
                className={`flex items-center gap-2 rounded bg-surface-raised px-4 py-2 font-mono text-sm font-bold transition hover:bg-surface-raised/80 ${
                  t.myVote ? "text-ship" : "text-ink"
                }`}
              >
                <span className="text-[18px]">⬆️</span>
                {t.voteCount}
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded bg-surface-raised px-4 py-2 font-mono text-sm font-bold text-ink-muted">
                <span className="text-[18px]">⬆️</span>
                {t.voteCount}
              </div>
            )}

            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-ink-muted">
              {/* Heat score removed as requested */}
            </div>
          </div>
        </article>
      ))}
      {err ? <p className="font-mono text-xs text-danger">{err}</p> : null}
    </div>
  );
}
