"use client";

import type { TaskStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import type { DashboardTask, DashboardMember } from "@/lib/cohort-dashboard";
import { TaskShipButton } from "./TaskShipButton";
import { TaskManagementModal } from "./TaskManagementModal";
import { updateTaskStatus } from "@/actions/update-task-status";

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
  onEdit,
}: {
  task: DashboardTask;
  viewerUserId: string | null;
  onOptimisticShip: (id: string) => void;
  onRollbackShip: (id: string) => void;
  onEdit: (task: DashboardTask) => void;
}) {
  const router = useRouter();
  const isShipped = task.status === "shipped";
  const isInProgress = task.status === "in_progress";
  let accent = "border-surface-border";

  if (isShipped) {
    accent = "border-ship/80 shadow-[0_0_12px_rgba(0,255,102,0.4)] hover:shadow-[0_0_20px_rgba(0,255,102,0.6)]";
  } else if (isInProgress) {
    accent = "border-focus/80 shadow-[0_0_12px_rgba(0,240,255,0.4)]";
  } else if (task.source === "github") {
    accent = "border-github/50 shadow-[0_0_0_1px_rgba(163,113,247,0.2)] hover:border-github/80 transition-colors";
  } else {
    accent = "border-ai/50 shadow-[0_0_0_1px_rgba(125,244,255,0.15)] hover:border-ai/80 transition-colors";
  }

  return (
    <article
      className={`relative flex flex-col gap-3 rounded-lg border bg-surface-container-high p-4 backdrop-blur-sm transition-shadow duration-300 ${accent}`}
    >
      <div className="flex items-start justify-between gap-2">
        {task.themeTag ? (
          <div className="rounded border border-surface-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-focus/90">
            {task.themeTag}
          </div>
        ) : (
          <div className="rounded border border-surface-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-muted">
            {task.source === "github" ? "GitHub Issue" : "AI Generated"}
          </div>
        )}
        <span className="material-symbols-outlined text-[16px] text-focus" style={{ fontVariationSettings: "'FILL' 0" }}>
          {task.source === "github" ? "data_object" : "smart_toy"}
        </span>
      </div>

      <h3 className="font-sans text-[15px] font-medium leading-snug text-ink">
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

      {isInProgress && (
        <div className="mt-2 h-1 w-full rounded-full bg-surface-muted overflow-hidden">
          <div className="h-full w-[65%] bg-focus rounded-full" />
        </div>
      )}

      <div className="mt-auto pt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {task.assignee?.image ? (
            <Image
              src={task.assignee.image}
              alt=""
              width={20}
              height={20}
              className="h-5 w-5 rounded border border-surface-border object-cover"
            />
          ) : (
            <div className="flex h-5 w-5 items-center justify-center rounded border border-surface-border bg-surface-muted font-mono text-[9px] text-ink-muted">
              {(task.assignee?.name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="font-mono text-[10px] uppercase tracking-wide text-focus font-bold">
            {task.status === "in_progress" ? "IN PROGRESS" : task.status === "shipped" ? "SHIPPED" : task.githubIssueNumber ? `#ISSUE-${task.githubIssueNumber}` : `#OPT-${task.id.slice(0, 2).toUpperCase()}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {viewerUserId && (
            <button
              onClick={() => onEdit(task)}
              className="rounded border border-ink bg-surface-raised px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-ink transition hover:bg-ink/10"
              title="Edit Task"
            >
              Edit
            </button>
          )}
          {task.status === "incoming" && viewerUserId && (
            <button
              onClick={async () => {
                await updateTaskStatus(task.id, "in_progress");
                router.refresh();
              }}
              className="rounded border border-focus bg-surface-raised px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-focus transition hover:bg-focus/10"
            >
              Start Work
            </button>
          )}
          {task.status === "shipped" && viewerUserId && (
            <button
              onClick={async () => {
                await updateTaskStatus(task.id, "in_progress");
                router.refresh();
              }}
              className="rounded border border-warning bg-surface-raised px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-warning transition hover:bg-warning/10"
            >
              Reopen
            </button>
          )}
          <TaskShipButton
            taskId={task.id}
            status={task.status}
            viewerUserId={viewerUserId}
            onOptimisticShip={onOptimisticShip}
            onRollbackShip={onRollbackShip}
          />
        </div>
      </div>
    </article>
  );
}

export function AssemblyLine({
  tasks,
  members,
  viewerUserId,
}: {
  tasks: DashboardTask[];
  members: DashboardMember[];
  viewerUserId: string | null;
}) {
  const { decorativeMotionDisabled } = useMotionPreference();
  const [optimistic, setOptimistic] = useState<Record<string, TaskStatus>>({});
  const [editingTask, setEditingTask] = useState<DashboardTask | null>(null);

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
        className={`relative overflow-hidden rounded border border-surface-border bg-surface-muted/30 ${decorativeMotionDisabled ? "" : "animate-conveyor"
          }`}
        style={{
          backgroundImage:
            "repeating-linear-gradient(-45deg, rgba(0,240,255,0.04) 0 10px, transparent 10px 20px)",
          backgroundSize: "28px 28px",
        }}
      >
        <div className="relative flex min-h-[500px] gap-6 overflow-x-auto p-4 md:p-6" style={{ backgroundImage: "repeating-linear-gradient(-45deg, rgba(255,255,255,0.02) 0 10px, transparent 10px 20px)", backgroundSize: "28px 28px" }}>
          {ZONES.map((zone) => {
            const list = byStatus(zone.status);
            const borderColor = zone.status === "in_progress" ? "border-focus" : zone.status === "shipped" ? "border-ship" : "border-surface-border";
            const borderTop = `border-t-4 ${borderColor}`;
            return (
              <motion.div
                layout
                key={zone.status}
                className={`flex min-w-[min(100%,320px)] flex-1 flex-col rounded border border-surface-border bg-[#1A1D23] shadow-lg ${borderTop}`}
              >
                <div className="flex items-center justify-between border-b border-surface-border/50 bg-surface-container-highest/20 px-4 py-3">
                  <div className="flex items-center gap-2">
                    {zone.status === "in_progress" && <div className="h-2 w-2 rounded-full bg-focus" />}
                    <div className="font-mono text-xs font-bold text-ink">
                      {zone.label}
                    </div>
                  </div>
                  <div className="flex h-6 min-w-[24px] items-center justify-center rounded bg-surface-muted/50 px-1.5 font-mono text-[10px] font-bold text-ink-muted">
                    {list.length}
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-4">
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
                    list.map((task, idx) => (
                      <TaskCard
                        key={`${task.id}-${idx}`}
                        task={task}
                        viewerUserId={viewerUserId}
                        onOptimisticShip={onOptimisticShip}
                        onRollbackShip={onRollbackShip}
                        onEdit={setEditingTask}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {editingTask && (
        <TaskManagementModal
          task={editingTask}
          members={members}
          onClose={() => setEditingTask(null)}
        />
      )}
    </section>
  );
}
