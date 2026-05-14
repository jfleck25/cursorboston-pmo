"use client";

import type { TaskStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import type { DashboardTask } from "@/lib/cohort-dashboard";
import { TaskShipButton } from "./TaskShipButton";

const ZONES: { status: TaskStatus; label: string; blurb: string }[] = [
  { status: "incoming", label: "Incoming", blurb: "Fresh intake" },
  { status: "in_progress", label: "In the Works", blurb: "Active builds" },
  { status: "shipped", label: "Shipped", blurb: "Cohort wins" },
];

function TaskCard({
  task,
  viewerUserId,
  onOptimisticShip,
  onRollbackShip,
}: {
  task: DashboardTask;
  viewerUserId: string | null;
  onOptimisticShip: (id: string) => void;
  onRollbackShip: (id: string) => void;
}) {
  const accent =
    task.source === "github"
      ? "border-github/50 shadow-[0_0_0_1px_rgba(163,113,247,0.2)]"
      : "border-ai/50 shadow-[0_0_0_1px_rgba(125,244,255,0.15)]";

  return (
    <article
      className={`rounded border bg-surface-raised/90 p-3 backdrop-blur-sm ${accent}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-sans text-sm font-semibold leading-snug text-ink">
          {task.githubHtmlUrl ? (
            <Link
              href={task.githubHtmlUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-focus"
            >
              {task.title}
            </Link>
          ) : (
            task.title
          )}
        </h3>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
            task.source === "github"
              ? "bg-github/15 text-github"
              : "bg-ai/15 text-ai"
          }`}
        >
          {task.source}
        </span>
      </div>
      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {task.description}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {task.assignee?.image ? (
            <Image
              src={task.assignee.image}
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] rounded border border-surface-border object-cover"
            />
          ) : (
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded border border-surface-border bg-surface-muted font-mono text-[10px] text-ink-muted">
              {(task.assignee?.name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="max-w-[120px] truncate font-mono text-[10px] text-ink-muted">
            {task.assignee?.name ?? "Unassigned"}
          </span>
        </div>
        {task.themeTag ? (
          <span className="truncate font-mono text-[10px] text-focus/90">
            {task.themeTag}
          </span>
        ) : null}
      </div>
      <TaskShipButton
        taskId={task.id}
        status={task.status}
        viewerUserId={viewerUserId}
        onOptimisticShip={onOptimisticShip}
        onRollbackShip={onRollbackShip}
      />
    </article>
  );
}

export function AssemblyLine({
  tasks,
  viewerUserId,
}: {
  tasks: DashboardTask[];
  viewerUserId: string | null;
}) {
  const { decorativeMotionDisabled } = useMotionPreference();
  const [optimistic, setOptimistic] = useState<Record<string, TaskStatus>>({});

  const merged = useMemo(() => {
    return tasks.map((t) => {
      const s = optimistic[t.id];
      if (!s) return t;
      return { ...t, status: s, shippedAt: s === "shipped" ? new Date().toISOString() : t.shippedAt };
    });
  }, [tasks, optimistic]);

  const onOptimisticShip = useCallback((id: string) => {
    setOptimistic((m) => ({ ...m, [id]: "shipped" }));
  }, []);

  const onRollbackShip = useCallback((id: string) => {
    setOptimistic((m) => {
      const next = { ...m };
      delete next[id];
      return next;
    });
  }, []);

  const byStatus = (s: TaskStatus) => merged.filter((t) => t.status === s);

  return (
    <section className="space-y-4">
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-focus">
          Assembly line
        </p>
        <h2 className="mt-1 font-sans text-xl font-semibold text-ink md:text-2xl">
          Conveyor
        </h2>
        <p className="mt-1 max-w-xl text-sm text-ink-muted">
          Horizontal belt: incoming intake, active work, and shipped glory—cohort-wide
          visibility.
        </p>
      </div>

      <div
        className={`relative overflow-hidden rounded border border-surface-border bg-surface-muted/30 ${
          decorativeMotionDisabled ? "" : "animate-conveyor"
        }`}
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(0,240,255,0.04) 0 10px, transparent 10px 20px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="relative flex min-h-[320px] gap-4 overflow-x-auto p-4 md:gap-5 md:p-5">
          {ZONES.map((zone) => {
            const list = byStatus(zone.status);
            return (
              <motion.div
                layout
                key={zone.status}
                className="flex min-w-[min(100%,280px)] flex-1 flex-col rounded border border-surface-border/80 bg-surface/85 p-3 shadow-[inset_0_0_0_1px_rgba(0,240,255,0.06)] backdrop-blur-md md:min-w-[300px]"
              >
                <div className="mb-3 border-b border-surface-border pb-2">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-ship">
                    {zone.label}
                  </div>
                  <div className="font-mono text-[10px] text-ink-muted">{zone.blurb}</div>
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  {list.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center rounded border border-dashed border-surface-border bg-surface-raised/40 px-3 py-10 text-center">
                      <p className="font-mono text-xs font-bold uppercase tracking-wide text-ink-muted">
                        Empty lane
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                        Nothing in this column yet. Pull the lever to slot new work, or ship cards
                        from Incoming / In the Works.
                      </p>
                    </div>
                  ) : (
                    list.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        viewerUserId={viewerUserId}
                        onOptimisticShip={onOptimisticShip}
                        onRollbackShip={onRollbackShip}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
