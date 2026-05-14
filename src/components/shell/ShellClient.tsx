"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { SlotMachineModal } from "@/components/slot-machine/SlotMachineModal";

export function ShellClient({ variant = "floating" }: { variant?: "floating" | "sidebar" }) {
  const [open, setOpen] = useState(false);
  const { decorativeMotionDisabled } = useMotionPreference();

  return (
    <>
      {variant === "floating" ? (
        <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-30 flex justify-center px-4">
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            className="pointer-events-auto group relative flex items-center gap-2 overflow-hidden rounded-full border-2 border-ship bg-ship px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.08em] text-surface shadow-ship transition hover:shadow-[0_0_28px_rgba(0,255,102,0.45)]"
            whileTap={
              decorativeMotionDisabled ? undefined : { scale: 0.97, y: 1 }
            }
            animate={
              decorativeMotionDisabled
                ? undefined
                : { boxShadow: ["0 0 20px rgba(0,255,102,0.35)", "0 0 32px rgba(0,255,102,0.55)", "0 0 20px rgba(0,255,102,0.35)"] }
            }
            transition={
              decorativeMotionDisabled
                ? { duration: 0 }
                : { boxShadow: { duration: 2.4, repeat: Infinity, ease: "easeInOut" } }
            }
          >
            <span
              aria-hidden
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-45deg, transparent, transparent 6px, rgba(0,0,0,0.08) 6px, rgba(0,0,0,0.08) 12px)",
              }}
            />
            <span className="relative">Pull the Lever</span>
          </motion.button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded bg-ship py-4 font-mono text-xs font-bold uppercase tracking-widest text-surface shadow-[0_0_12px_rgba(0,255,102,0.4)] transition hover:bg-[#6bff83] hover:shadow-[0_0_20px_rgba(0,255,102,0.6)]"
        >
          Pull the Lever
        </button>
      )}

      <SlotMachineModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
