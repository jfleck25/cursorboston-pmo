"use client";

import type { TaskStatus } from "@prisma/client";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { shipTask } from "@/actions/ship-task";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";

type TaskShipButtonProps = {
  taskId: string;
  status: TaskStatus;
  viewerUserId: string | null;
  onOptimisticShip?: (taskId: string) => void;
  onRollbackShip?: (taskId: string) => void;
};

export function TaskShipButton({
  taskId,
  status,
  viewerUserId,
  onOptimisticShip,
  onRollbackShip,
}: TaskShipButtonProps) {
  const router = useRouter();
  const { decorativeMotionDisabled } = useMotionPreference();
  const [pending, setPending] = useState(false);
  const [burst, setBurst] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const canShip = Boolean(viewerUserId) && status !== "shipped" && !pending;

  const run = useCallback(async () => {
    if (!viewerUserId || status === "shipped" || pending) return;
    setPending(true);
    setToast(null);
    onOptimisticShip?.(taskId);
    const res = await shipTask(taskId);
    if (!res.ok) {
      onRollbackShip?.(taskId);
      setToast(res.error ?? "Ship failed.");
      setPending(false);
      return;
    }
    if (res.alreadyShipped) {
      setPending(false);
      router.refresh();
      return;
    }
    if (!decorativeMotionDisabled) {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 900);
    }
    setPending(false);
    router.refresh();
  }, [
    viewerUserId,
    status,
    pending,
    taskId,
    onOptimisticShip,
    onRollbackShip,
    router,
    decorativeMotionDisabled,
  ]);

  if (!viewerUserId || status === "shipped") return null;

  return (
    <div className="relative mt-2 flex flex-col items-end gap-1">
      {burst ? (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -right-1 -top-6 h-16 w-16 rounded-full border-2 border-ship/80 shadow-[0_0_24px_rgba(0,255,102,0.55)]"
          initial={{ scale: 0.4, opacity: 0.9 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 0.85, ease: "easeOut" }}
        />
      ) : null}
      <motion.button
        type="button"
        disabled={!canShip}
        onClick={() => void run()}
        className="rounded border-2 border-ship bg-ship/90 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-surface shadow-ship transition enabled:hover:shadow-[0_0_18px_rgba(0,255,102,0.45)] disabled:cursor-not-allowed disabled:opacity-40"
        whileTap={decorativeMotionDisabled || !canShip ? undefined : { scale: 0.96 }}
      >
        {pending ? "…" : "Ship"}
      </motion.button>
      {toast ? (
        <p className="max-w-[200px] text-right font-mono text-[10px] text-danger">{toast}</p>
      ) : null}
    </div>
  );
}
