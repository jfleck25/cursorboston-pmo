"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { prefetchGithubQuickWins } from "@/actions/github-quick-wins";
import { prefetchSlotLlmIdeas } from "@/actions/slot-llm";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";

type SlotModalProps = {
  open: boolean;
  onClose: () => void;
};

type Reel = {
  title: string;
  detail: string;
};

const MOCK_DEALS: Reel[][] = [
  [
    { title: "GitHub", detail: "labeled quick-win" },
    { title: "Thin slice", detail: "one vertical" },
    { title: "Demo-ready", detail: "video + README" },
  ],
  [
    { title: "AI", detail: "cohort-shaped idea" },
    { title: "Polish pass", detail: "motion + a11y" },
    { title: "Friday-safe", detail: "shippable today" },
  ],
  [
    { title: "GitHub", detail: "docs gap" },
    { title: "Tooling", detail: "DX win" },
    { title: "Visible", detail: "Discord-worthy" },
  ],
];

function ReelColumn({
  label,
  reel,
  busy,
  index,
  reduced,
}: {
  label: string;
  reel: Reel | null;
  busy: boolean;
  index: number;
  reduced: boolean;
}) {
  const showContent = Boolean(reel) && !busy;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-focus/90">
        {label}
      </div>
      <div className="relative min-h-[112px] overflow-hidden rounded border border-surface-border bg-surface/80 px-2 py-4 text-center shadow-[inset_0_0_24px_rgba(0,240,255,0.06)]">
        <AnimatePresence mode="wait">
          {!showContent ? (
            <motion.div
              key="skeleton"
              initial={reduced ? false : { opacity: 0.45 }}
              animate={
                reduced
                  ? { opacity: 0.55 }
                  : { opacity: busy ? [0.35, 0.9, 0.35] : 0.5 }
              }
              exit={{ opacity: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: busy ? 0.85 : 0.2, repeat: busy ? Infinity : 0 }
              }
              className="space-y-2"
            >
              <div className="mx-auto h-3 w-3/4 rounded bg-surface-muted" />
              <div className="mx-auto h-3 w-1/2 rounded bg-surface-muted/80" />
              <p className="pt-2 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                {busy ? "Loading reel…" : "Waiting for prefetch"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`${reel!.title}-${reel!.detail}`}
              initial={reduced ? false : { y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduced ? undefined : { y: -12, opacity: 0 }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 380, damping: 28, delay: index * 0.05 }
              }
            >
              <div className="font-mono text-xs font-bold uppercase tracking-wide text-ship">
                {reel!.title}
              </div>
              <div className="mt-2 text-[11px] leading-snug text-ink-muted">{reel!.detail}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function truncateReelTitle(title: string, max = 72): string {
  if (title.length <= max) return title;
  return `${title.slice(0, max - 1)}…`;
}

export function SlotMachineModal({ open, onClose }: SlotModalProps) {
  const { decorativeMotionDisabled } = useMotionPreference();
  const [phase, setPhase] = useState<"empty" | "loading" | "ready" | "spinning">("empty");
  const [dealIndex, setDealIndex] = useState(0);
  const [githubSourceReel, setGithubSourceReel] = useState<Reel | null>(null);
  const [llmMidReel, setLlmMidReel] = useState<Reel | null>(null);
  const [llmOutReel, setLlmOutReel] = useState<Reel | null>(null);
  const [footerHint, setFooterHint] = useState<string | null>(null);
  const spinTimer = useRef<number | null>(null);

  const reels = useMemo(() => {
    const base = [...MOCK_DEALS[dealIndex % MOCK_DEALS.length]];
    if (githubSourceReel) base[0] = githubSourceReel;
    if (llmMidReel) base[1] = llmMidReel;
    if (llmOutReel) base[2] = llmOutReel;
    return base;
  }, [dealIndex, githubSourceReel, llmMidReel, llmOutReel]);

  useLayoutEffect(() => {
    if (!open) {
      setPhase("empty");
      setGithubSourceReel(null);
      setLlmMidReel(null);
      setLlmOutReel(null);
      setFooterHint(null);
      return;
    }

    setPhase("loading");
    setGithubSourceReel(null);
    setLlmMidReel(null);
    setLlmOutReel(null);
    setFooterHint(null);

    const minDelay = decorativeMotionDisabled ? 0 : 900;
    const delayP = new Promise<void>((resolve) => {
      window.setTimeout(resolve, minDelay);
    });

    let cancelled = false;
    void (async () => {
      const [, gh, llm] = await Promise.all([
        delayP,
        prefetchGithubQuickWins(),
        prefetchSlotLlmIdeas(),
      ]);
      if (cancelled) return;

      const hints: string[] = [];
      if (!gh.ok) {
        hints.push(`GitHub: ${gh.error}`);
      } else if (
        gh.ok &&
        "configured" in gh &&
        gh.configured &&
        gh.candidates.length > 0
      ) {
        const c = gh.candidates[0];
        setGithubSourceReel({
          title: truncateReelTitle(c.title),
          detail: `${c.githubOwner}/${c.githubRepo}#${c.githubIssueNumber} · quick-win`,
        });
      }

      if (llm.ok === false) {
        hints.push(`AI: ${llm.error}`);
      } else if (
        llm.ok &&
        !("anonymous" in llm && llm.anonymous) &&
        "configured" in llm &&
        llm.configured &&
        "ideas" in llm &&
        llm.ideas.length >= 2
      ) {
        setLlmMidReel({
          title: truncateReelTitle(llm.ideas[0].title),
          detail: llm.ideas[0].suggestedScope,
        });
        setLlmOutReel({
          title: truncateReelTitle(llm.ideas[1].title),
          detail: llm.ideas[1].oneLiner,
        });
      }

      setFooterHint(hints.length ? hints.join(" · ") : null);

      setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [open, decorativeMotionDisabled]);

  useEffect(() => {
    return () => {
      if (spinTimer.current) window.clearTimeout(spinTimer.current);
    };
  }, []);

  const busy = open && phase !== "ready";

  const spin = () => {
    if (phase !== "ready") return;
    if (spinTimer.current) window.clearTimeout(spinTimer.current);
    setPhase("spinning");
    const delay = decorativeMotionDisabled ? 0 : 700;
    spinTimer.current = window.setTimeout(() => {
      setDealIndex((i) => i + 1);
      setPhase("ready");
      spinTimer.current = null;
    }, delay);
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close slot machine"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={decorativeMotionDisabled ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={decorativeMotionDisabled ? undefined : { opacity: 0 }}
            transition={{ duration: decorativeMotionDisabled ? 0 : 0.2 }}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="slot-modal-title"
              className="pointer-events-auto w-full max-w-2xl rounded border border-focus/35 bg-glass-panel p-6 shadow-focus backdrop-blur-xl"
              initial={decorativeMotionDisabled ? false : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={decorativeMotionDisabled ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
              transition={
                decorativeMotionDisabled
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 420, damping: 32 }
              }
            >
              <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-focus">
                Phase 2 · Intake
              </div>
              <h2
                id="slot-modal-title"
                className="font-sans text-xl font-semibold text-ink md:text-2xl"
              >
                Slot machine
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Three reels: source, scope, output. After sign-in, Source can load from a GitHub App
                (allowlisted <span className="font-mono text-github">quick-win</span> issues) and
                Tech / Output from OpenAI via <span className="font-mono text-ai">generateObject</span>{" "}
                (rate-limited). Task save + idempotency land in the next plan step.
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                <ReelColumn
                  label="Source"
                  reel={reels[0]}
                  busy={busy}
                  index={0}
                  reduced={decorativeMotionDisabled}
                />
                <ReelColumn
                  label="Tech / scope"
                  reel={reels[1]}
                  busy={busy}
                  index={1}
                  reduced={decorativeMotionDisabled}
                />
                <ReelColumn
                  label="Output"
                  reel={reels[2]}
                  busy={busy}
                  index={2}
                  reduced={decorativeMotionDisabled}
                />
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-ink-muted">
                  {footerHint
                    ? footerHint
                    : phase === "loading"
                      ? "Prefetching GitHub + AI (install token + generateObject) + minimum arm delay…"
                      : phase === "ready"
                        ? githubSourceReel || llmMidReel
                          ? `Armed: ${[
                              githubSourceReel ? "GitHub source" : null,
                              llmMidReel ? "AI reels" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}. Spin still rotates any reel still on mock data.`
                          : "Reels armed on mock combos until GitHub App, OpenAI, and Upstash env are set (see .env.example)."
                        : phase === "spinning"
                          ? "Shuffling…"
                          : "Arming reels…"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded border border-surface-border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-ink-muted transition hover:border-focus hover:text-focus"
                  >
                    Close
                  </button>
                  <motion.button
                    type="button"
                    onClick={spin}
                    disabled={phase !== "ready"}
                    className="rounded border-2 border-ship bg-ship px-5 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-surface shadow-ship transition enabled:hover:shadow-[0_0_26px_rgba(0,255,102,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
                    whileTap={
                      decorativeMotionDisabled || phase === "loading"
                        ? undefined
                        : { scale: 0.97 }
                    }
                  >
                    Spin
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
