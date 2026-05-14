"use client";

import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";

export function MotionToggle() {
  const { userReducedMotion, setUserReducedMotion } = useMotionPreference();

  return (
    <label className="flex cursor-pointer select-none items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
      <span className="hidden sm:inline">Reduce motion</span>
      <input
        type="checkbox"
        className="h-3.5 w-3.5 accent-focus"
        checked={userReducedMotion}
        onChange={(e) => setUserReducedMotion(e.target.checked)}
      />
    </label>
  );
}
