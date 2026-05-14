"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { DashboardTask, DashboardMember } from "@/lib/cohort-dashboard";
import { updateTaskDetails } from "@/actions/update-task-details";
import { deleteTask } from "@/actions/delete-task";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";

type TaskManagementModalProps = {
  task: DashboardTask | null;
  members: DashboardMember[];
  onClose: () => void;
};

export function TaskManagementModal({ task, members, onClose }: TaskManagementModalProps) {
  const router = useRouter();
  const { decorativeMotionDisabled } = useMotionPreference();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assigneeUserId, setAssigneeUserId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setAssigneeUserId(task.assigneeUserId || "");
    }
  }, [task]);

  if (!task) return null;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await updateTaskDetails(task.id, {
        title,
        description,
        assigneeUserId: assigneeUserId || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to save.");
      } else {
        onClose();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task? This cannot be undone.")) return;
    
    setBusy(true);
    setError(null);
    try {
      const res = await deleteTask(task.id);
      if (!res.ok) {
        setError(res.error ?? "Failed to delete.");
      } else {
        onClose();
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        aria-label="Close edit modal"
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
          className="pointer-events-auto w-full max-w-lg rounded border border-surface-border bg-surface-container-high p-6 shadow-xl backdrop-blur-md"
          initial={decorativeMotionDisabled ? false : { opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={decorativeMotionDisabled ? undefined : { opacity: 0, scale: 0.98, y: 8 }}
          transition={
            decorativeMotionDisabled
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 32 }
          }
        >
          <h2 className="font-sans text-xl font-semibold text-ink">Edit Task</h2>
          
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-ink-muted mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-surface-raised border border-surface-border rounded-md py-2 px-3 text-sm text-ink focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              />
            </div>
            
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-ink-muted mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full bg-surface-raised border border-surface-border rounded-md py-2 px-3 text-sm text-ink focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wide text-ink-muted mb-1">Assignee</label>
              <select
                value={assigneeUserId}
                onChange={(e) => setAssigneeUserId(e.target.value)}
                className="w-full bg-surface-raised border border-surface-border rounded-md py-2 px-3 text-sm text-ink focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus"
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name || "Member"}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="mt-2 text-xs font-mono text-danger">{error}</p>}

          <div className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={() => void handleDelete()}
              disabled={busy}
              className="rounded border border-danger/50 bg-danger/10 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-danger transition hover:bg-danger/20 disabled:opacity-50"
            >
              {busy ? "..." : "Delete Task"}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-surface-border px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-ink-muted transition hover:border-focus hover:text-focus"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy}
                className="rounded border-2 border-focus bg-focus/15 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wide text-focus transition hover:bg-focus/25 disabled:opacity-50"
              >
                {busy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
