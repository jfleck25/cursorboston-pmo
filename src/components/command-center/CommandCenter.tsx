"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useMotionPreference } from "@/components/providers/MotionPreferenceProvider";
import { COHORT_WEEK_SHIP_TARGET } from "@/lib/momentum-constants";
import type { ActiveWeek, DashboardMember, DashboardTask } from "@/lib/cohort-dashboard";

type RadarBlip = {
  member: DashboardMember;
  angle: number;
  /** 0 = outer ring (no week assignments or no progress), 1 = hub (all assigned shipped). */
  inward: number;
  assignedWeek: number;
  shippedWeek: number;
};

function computeBlips(
  members: DashboardMember[],
  tasks: DashboardTask[],
  activeWeekId: string | null,
): RadarBlip[] {
  if (!activeWeekId || members.length === 0) return [];

  return members.map((member, index) => {
    const mine = tasks.filter(
      (t) => t.assigneeUserId === member.id && t.weekId === activeWeekId,
    );
    const assignedWeek = mine.length;
    const shippedWeek = mine.filter((t) => t.status === "shipped").length;

    // 0 = outer ring (no week assignments)
    // 0.5 = floating area (assigned but 0 shipped)
    // 1 = hub (1+ shipped)
    let inward = 0;
    if (assignedWeek > 0) {
      inward = shippedWeek > 0 ? 1 : 0.5;
    }

    const angle = (2 * Math.PI * index) / members.length - Math.PI / 2;

    return { member, angle, inward, assignedWeek, shippedWeek };
  });
}

export function CommandCenter({
  activeWeek,
  tasks,
  members,
  weekTaskCount,
  weekShippedCount,
}: {
  activeWeek: ActiveWeek | null;
  tasks: DashboardTask[];
  members: DashboardMember[];
  weekTaskCount: number;
  weekShippedCount: number;
}) {
  const { decorativeMotionDisabled } = useMotionPreference();
  const blips = computeBlips(members, tasks, activeWeek?.id ?? null);

  const stretch =
    weekTaskCount === 0
      ? 0
      : Math.min(100, Math.round((100 * weekShippedCount) / COHORT_WEEK_SHIP_TARGET));

  const actualFuelPercent = Math.min(100, Math.round((100 * weekShippedCount) / COHORT_WEEK_SHIP_TARGET));

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      <div className="space-y-3">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-focus">
          Command center
        </p>
        <h2 className="font-sans text-xl font-semibold text-ink md:text-2xl">Cohort fuel</h2>
        <p className="text-sm text-ink-muted">
          Fill tracks{" "}
          <span className="font-mono text-ink">shipped ÷ target ({COHORT_WEEK_SHIP_TARGET})</span>. Stretch line
          compares ships to a cohort weekly target (
          <span className="font-mono text-ship">{COHORT_WEEK_SHIP_TARGET}</span>
          ).
        </p>

        <div className="rounded border border-surface-border bg-surface-raised/70 p-4 backdrop-blur-md">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-wide text-ink-muted">
                Week completion
              </div>
              <div className="mt-1 font-mono text-3xl font-bold tabular-nums text-ship">
                {weekTaskCount === 0 ? "—" : `${actualFuelPercent}%`}
              </div>
              <div className="mt-1 font-mono text-[11px] text-ink-muted">
                {weekTaskCount === 0
                  ? "No tasks on the active week yet."
                  : `${weekShippedCount} shipped · ${weekTaskCount} scoped this week`}
              </div>
            </div>
            <div
              className="relative h-16 w-10 shrink-0 rounded-sm border border-ship/40 bg-gradient-to-t from-ship/25 to-transparent shadow-ship"
              aria-hidden
            >
              <motion.div
                className="absolute bottom-0 left-0 right-0 rounded-b-sm bg-gradient-to-t from-ship to-ship-dim"
                initial={false}
                animate={{
                  height: `${weekTaskCount === 0 ? 6 : Math.max(8, actualFuelPercent)}%`,
                }}
                transition={
                  decorativeMotionDisabled
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 120, damping: 18 }
                }
              />
            </div>
          </div>

          <div
            className="mt-4 h-3 w-full overflow-hidden rounded-full border border-surface-border bg-surface"
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={weekTaskCount === 0 ? 0 : actualFuelPercent}
            aria-label="Cohort fuel for active week tasks"
          >
            <div
              className="h-full bg-gradient-to-r from-ship-dim to-ship shadow-ship transition-[width] duration-500 ease-out"
              style={{ width: `${weekTaskCount === 0 ? 0 : actualFuelPercent}%` }}
            />
          </div>

          <div className="mt-4 border-t border-surface-border pt-3">
            <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wide text-ink-muted">
              <span>Stretch vs {COHORT_WEEK_SHIP_TARGET} / wk</span>
              <span className="tabular-nums text-focus">{stretch}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-focus/70"
                style={{ width: `${stretch}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-sans text-lg font-semibold text-ink">Live radar</h3>
        <p className="text-sm text-ink-muted">
          Each dot is a cohort member. Distance to center is state-based:{' '}
          <span className="font-mono text-ink">Idle → Assigned → Shipped</span>{' '}
          (outer ring when not on the board this week—non-competitive signal).
        </p>

        <div className="relative mx-auto aspect-square w-full max-w-[340px] rounded-full border border-focus/25 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08),transparent_55%)] p-4 shadow-focus/20">
          {!decorativeMotionDisabled ? (
            <motion.div
              className="pointer-events-none absolute inset-6 rounded-full border border-focus/15"
              animate={{ opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : (
            <div className="pointer-events-none absolute inset-6 rounded-full border border-focus/15 opacity-25" />
          )}

          <div className="relative flex h-full w-full items-center justify-center">
            <div className="absolute flex h-[18%] w-[18%] items-center justify-center rounded-full border border-ship/50 bg-ship/15 font-mono text-[10px] font-bold uppercase tracking-wide text-ship shadow-ship">
              Ship
            </div>

            {blips.length === 0 ? (
              <div className="max-w-[220px] px-4 text-center">
                <p className="font-mono text-xs font-bold uppercase tracking-wide text-ink-muted">
                  Radar offline
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                  {!activeWeek
                    ? "Pin an active week to anchor the radar."
                    : "No signed-in cohort members yet—invite the crew."}
                </p>
              </div>
            ) : (
              blips.map((blip, idx) => {
                const outer = 44;
                const inner = 16;
                const radiusPct = outer - blip.inward * (outer - inner);
                const x = 50 + radiusPct * Math.cos(blip.angle);
                const y = 50 + radiusPct * Math.sin(blip.angle);

                return (
                  <motion.div
                    key={`${blip.member.id}-${idx}`}
                    className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                    style={{ left: `${x}%`, top: `${y}%` }}
                    initial={false}
                    animate={
                      decorativeMotionDisabled
                        ? { scale: 1 }
                        : { scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }
                    }
                    transition={
                      decorativeMotionDisabled
                        ? { duration: 0 }
                        : { duration: 3.2 + (blip.angle % 1), repeat: Infinity, ease: "easeInOut" }
                    }
                    title={`${blip.member.name ?? "Member"} · ${blip.shippedWeek}/${blip.assignedWeek} week ships`}
                  >
                    <div className="relative">
                      <div className="absolute -inset-1 rounded-full bg-focus/15 blur-[6px]" />
                      {blip.member.image ? (
                        <Image
                          src={blip.member.image}
                          alt=""
                          width={36}
                          height={36}
                          className="relative h-9 w-9 rounded-full border border-focus/40 object-cover"
                        />
                      ) : (
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-full border border-focus/40 bg-surface-muted font-mono text-xs text-ink">
                          {(blip.member.name ?? "?").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="max-w-[72px] truncate rounded bg-surface/90 px-1.5 py-0.5 text-center font-mono text-[9px] text-ink-muted">
                      {blip.assignedWeek === 0
                        ? "idle"
                        : `${blip.shippedWeek}/${blip.assignedWeek}`}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
