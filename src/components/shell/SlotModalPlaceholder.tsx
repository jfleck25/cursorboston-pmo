"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";

type SlotModalPlaceholderProps = {
  open: boolean;
  onClose: () => void;
};

export function SlotModalPlaceholder({ open, onClose }: SlotModalPlaceholderProps) {
  const { decorativeMotionDisabled } = useMotionPreference();

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
              className="pointer-events-auto w-full max-w-lg rounded border border-focus/40 bg-surface-raised/95 p-6 shadow-focus backdrop-blur-xl"
              initial={
                decorativeMotionDisabled
                  ? false
                  : { opacity: 0, scale: 0.96, y: 12 }
              }
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={
                decorativeMotionDisabled
                  ? undefined
                  : { opacity: 0, scale: 0.98, y: 8 }
              }
              transition={
                decorativeMotionDisabled
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 420, damping: 32 }
              }
            >
              <div className="mb-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-focus">
                Phase 2
              </div>
              <h2
                id="slot-modal-title"
                className="font-sans text-xl font-semibold text-ink md:text-2xl"
              >
                The Slot Machine
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                Reels, GitHub + LLM prefetch, and save flow land in Phase 2. For now,
                this modal proves the lever wiring, glass panel styling, and reduced-motion
                behavior.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded border border-surface-border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-ink-muted transition hover:border-focus hover:text-focus"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
