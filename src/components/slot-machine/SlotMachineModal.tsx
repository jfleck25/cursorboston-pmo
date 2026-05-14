"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { prefetchSlotBundle } from "@/actions/prefetch-slot-bundle";
import { prefetchGithubQuickWins } from "@/actions/github-quick-wins";
import { prefetchSlotLlmIdeas } from "@/actions/slot-llm";
import { saveSpunTask } from "@/actions/save-spun-task";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import type { GithubIssueCandidate } from "@/lib/github-app-types";
import type { SlotIdea } from "@/lib/llm-slot-schema";

type SlotModalProps = {
  open: boolean;
  onClose: () => void;
};

type SlotCandidate = 
  | { type: "github"; data: GithubIssueCandidate }
  | { type: "ai"; data: SlotIdea };




export function SlotMachineModal({ open, onClose }: SlotModalProps) {
  const router = useRouter();
  const { decorativeMotionDisabled } = useMotionPreference();
  const [phase, setPhase] = useState<"empty" | "loading" | "ready" | "spinning">("empty");
  const [dealIndex, setDealIndex] = useState(0);
  const [candidates, setCandidates] = useState<SlotCandidate[]>([]);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [footerHint, setFooterHint] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveHint, setSaveHint] = useState<string | null>(null);
  const spinTimer = useRef<number | null>(null);

  const currentCandidate = candidates.length > 0 ? candidates[dealIndex % candidates.length] : null;


  useLayoutEffect(() => {
    if (!open) {
      setPhase("empty");
      setCandidates([]);

      setGithubError(null);
      setLlmError(null);
      setFooterHint(null);
      setSaveHint(null);
      return;
    }

    setPhase("loading");
    setCandidates([]);
    setGithubError(null);
    setLlmError(null);
    setFooterHint(null);
    setSaveHint(null);

    const minDelay = decorativeMotionDisabled ? 0 : 900;
    const delayP = new Promise<void>((resolve) => {
      window.setTimeout(resolve, minDelay);
    });

    let cancelled = false;
    void (async () => {
      const settled = await Promise.allSettled([delayP, prefetchSlotBundle()]);
      if (cancelled) return;
      if (settled[1].status === "rejected") {
        setGithubError("Prefetch failed.");
        setLlmError("Prefetch failed.");
        setPhase("ready");
        return;
      }
      const bundle = settled[1].value;
      const { github: gh, llm } = bundle;

      const nextCandidates: SlotCandidate[] = [];

      if (!gh.ok) {
        setGithubError(gh.error);
      } else if (gh.ok && "configured" in gh && gh.configured && gh.candidates.length > 0) {
        gh.candidates.forEach(c => nextCandidates.push({ type: "github", data: c }));
      }

      if (llm.ok === false) {
        setLlmError(llm.error);
      } else if (
        llm.ok &&
        !("anonymous" in llm && llm.anonymous) &&
        "configured" in llm &&
        llm.configured &&
        "ideas" in llm &&
        llm.ideas.length > 0
      ) {
        llm.ideas.forEach(i => nextCandidates.push({ type: "ai", data: i }));
      }

      setCandidates(nextCandidates);

      const hints: string[] = [];
      if (!gh.ok) hints.push(`GitHub: ${gh.error}`);
      if (llm.ok === false) hints.push(`AI: ${llm.error}`);
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

  const busy = open && (phase === "loading" || phase === "empty");

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

  const canSave = Boolean(currentCandidate);

  const save = async () => {
    if (!currentCandidate || saveBusy) return;
    setSaveBusy(true);
    setSaveHint(null);
    const idempotencyKey = crypto.randomUUID();
    try {
      if (currentCandidate.type === "github") {
        const g = currentCandidate.data;
        const res = await saveSpunTask({
          source: "github",
          idempotencyKey,
          github: {
            githubOwner: g.githubOwner,
            githubRepo: g.githubRepo,
            githubIssueNumber: g.githubIssueNumber,
            githubNodeId: g.githubNodeId,
            githubHtmlUrl: g.githubHtmlUrl,
            title: g.title,
            description: g.description,
          },
        });
        if (!res.ok) {
          setSaveHint(res.error);
        } else {
          setSaveHint(res.deduped ? "Already saved." : "Saved to board.");
          if (!res.deduped) router.refresh();
        }
      } else if (currentCandidate.type === "ai") {
        const i = currentCandidate.data;
        const res = await saveSpunTask({
          source: "ai",
          idempotencyKey,
          ai: {
            title: i.title,
            description: `${i.oneLiner}\n\nScope: ${i.suggestedScope}`,
          },
        });
        if (!res.ok) {
          setSaveHint(res.error);
        } else {
          setSaveHint(res.deduped ? "Already saved." : "Saved to board.");
          if (!res.deduped) router.refresh();
        }
      }
    } finally {
      setSaveBusy(false);
    }
  };


  const retryGithub = () => {
    setGithubError(null);
    void (async () => {
      const gh = await prefetchGithubQuickWins();
      if (!gh.ok) {
        setGithubError(gh.error);
        return;
      }
      if (gh.ok && "configured" in gh && gh.configured && gh.candidates.length > 0) {
        setCandidates(prev => [
          ...prev.filter(c => c.type !== "github"),
          ...gh.candidates.map(c => ({ type: "github" as const, data: c }))
        ]);
      }
    })();
  };

  const retryLlm = () => {
    setLlmError(null);
    void (async () => {
      const llm = await prefetchSlotLlmIdeas();
      if (llm.ok === false) {
        setLlmError(llm.error);
        return;
      }
      if (
        llm.ok &&
        !("anonymous" in llm && llm.anonymous) &&
        "configured" in llm &&
        llm.configured &&
        "ideas" in llm &&
        llm.ideas.length > 0
      ) {
        setCandidates(prev => [
          ...prev.filter(c => c.type !== "ai"),
          ...llm.ideas.map(i => ({ type: "ai" as const, data: i }))
        ]);
      }
    })();
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
              className={`pointer-events-auto w-full max-w-2xl rounded border border-focus/35 bg-glass-panel p-6 shadow-focus backdrop-blur-xl ${phase === "spinning" ? "animate-shake" : ""}`}
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
                Phase 3 · Intake
              </div>
              <h2
                id="slot-modal-title"
                className="font-sans text-xl font-semibold text-ink md:text-2xl"
              >
                Slot machine
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                One unified window for tasks. Prefetch uses{" "}
                <span className="font-mono text-focus">Promise.allSettled</span> so GitHub and AI
                can fail independently. Save uses a client{" "}
                <span className="font-mono text-ai">crypto.randomUUID()</span> idempotency key.
              </p>


              <div className="mt-6">
                <div className="relative min-h-[220px] overflow-hidden rounded-lg border-2 border-focus/30 bg-surface/90 p-6 shadow-[inset_0_0_40px_rgba(0,240,255,0.08)]">
                  <AnimatePresence mode="wait">
                    {phase === "spinning" ? (
                      <motion.div
                        key="spinning"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex h-full flex-col items-center justify-center space-y-4 py-8"
                      >
                        <div className="flex gap-2">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              animate={{
                                y: [-10, 10, -10],
                                opacity: [0.3, 1, 0.3],
                              }}
                              transition={{
                                duration: 0.4,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                              className="h-3 w-3 rounded-full bg-focus"
                            />
                          ))}
                        </div>
                        <div className="font-mono text-sm font-bold uppercase tracking-widest text-focus/60">
                          Shuffling Pool...
                        </div>
                      </motion.div>
                    ) : busy ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex h-full flex-col items-center justify-center space-y-4 py-8 text-center"
                      >
                        <div className="h-8 w-48 animate-pulse rounded bg-surface-muted" />
                        <div className="h-4 w-32 animate-pulse rounded bg-surface-muted/60" />
                        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-muted">
                          Arming Reels...
                        </p>
                      </motion.div>
                    ) : currentCandidate ? (
                      <motion.div
                        key={currentCandidate.type === "github" ? currentCandidate.data.githubNodeId : currentCandidate.data.title}
                        initial={decorativeMotionDisabled ? false : { y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="flex h-full flex-col"
                      >
                        <div className="mb-4 flex items-center justify-between border-b border-surface-border pb-3">
                          <div className="flex items-center gap-2">
                            <div className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${currentCandidate.type === "github" ? "bg-focus/20 text-focus" : "bg-ai/20 text-ai"}`}>
                              {currentCandidate.type === "github" ? "GitHub" : "AI Idea"}
                            </div>
                            {currentCandidate.type === "github" && (
                              <div className="font-mono text-[10px] text-ink-muted">
                                {currentCandidate.data.githubOwner}/{currentCandidate.data.githubRepo}#{currentCandidate.data.githubIssueNumber}
                              </div>
                            )}
                          </div>
                        </div>

                        <h3 className="font-sans text-lg font-bold leading-tight text-ink md:text-xl">
                          {currentCandidate.data.title}
                        </h3>

                        <div className="mt-4 flex-1">
                          <p className="line-clamp-4 text-sm leading-relaxed text-ink-muted">
                            {currentCandidate.type === "github" 
                              ? currentCandidate.data.description || "No description provided."
                              : currentCandidate.data.oneLiner}
                          </p>
                          {currentCandidate.type === "ai" && (
                            <div className="mt-3 rounded border border-ai/20 bg-ai/5 p-2">
                              <div className="font-mono text-[9px] font-bold uppercase text-ai/70">Suggested Scope</div>
                              <div className="mt-1 text-xs text-ink-muted">{currentCandidate.data.suggestedScope}</div>
                            </div>
                          )}
                        </div>

                        {currentCandidate.type === "github" && (
                          <div className="mt-4">
                            <a
                              href={currentCandidate.data.githubHtmlUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] font-medium text-focus hover:underline"
                            >
                              View on GitHub <span aria-hidden="true">↗</span>
                            </a>
                          </div>
                        )}
                      </motion.div>
                    ) : (
                      <div className="flex h-full items-center justify-center py-12 text-center">
                        <p className="text-sm text-ink-muted italic">No tasks available in pool.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>


              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-xs text-ink-muted">
                  {saveHint ? (
                    <span className="text-ship">{saveHint}</span>
                  ) : footerHint ? (
                    footerHint
                  ) : phase === "loading" ? (
                    "Prefetching GitHub + AI (allSettled bundle) + minimum arm delay…"
                  ) : phase === "ready" ? (
                    currentCandidate ? (
                      `Armed: ${[
                        currentCandidate.type === "github" ? "GitHub source" : "AI task",
                      ]
                        .filter(Boolean)
                        .join(" · ")}. Spin reshuffles issues from pool.`
                    ) : (
                      "Reels armed on mock combos until GitHub App + OpenAI + Upstash env are set (see .env.example)."
                    )

                  ) : phase === "spinning" ? (
                    "Shuffling…"
                  ) : (
                    "Arming reels…"
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
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
                    className="group relative overflow-hidden rounded-lg border-b-4 border-[#006e27] bg-ship px-8 py-3 font-mono text-sm font-bold uppercase tracking-[0.15em] text-surface shadow-[0_0_12px_rgba(0,255,102,0.4)] transition-all enabled:hover:bg-[#6bff83] enabled:hover:shadow-[0_0_20px_rgba(0,255,102,0.6)] disabled:cursor-not-allowed disabled:opacity-40"
                    whileTap={
                      decorativeMotionDisabled || phase === "loading"
                        ? undefined
                        : { scale: 0.97, y: 2 }
                    }
                  >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                    <span className="relative z-10 flex items-center gap-2">Spin</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => void save()}
                    disabled={!canSave || saveBusy || phase !== "ready"}
                    className="rounded border-2 border-focus bg-focus/15 px-5 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] text-focus transition enabled:hover:bg-focus/25 disabled:cursor-not-allowed disabled:opacity-40"
                    whileTap={
                      decorativeMotionDisabled || !canSave ? undefined : { scale: 0.97 }
                    }
                  >
                    {saveBusy ? "Saving…" : "Save to board"}
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
