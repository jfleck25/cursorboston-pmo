import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const session = await auth();

  let cohortName: string | null = null;
  let weekTitle: string | null = null;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        cohort: { select: { id: true, name: true } },
      },
    });
    cohortName = user?.cohort?.name ?? null;

    const cohortId = user?.cohort?.id;
    const week = cohortId
      ? await prisma.week.findFirst({
          where: { cohortId, isActive: true },
          orderBy: { sortIndex: "asc" },
          select: { title: true },
        })
      : null;
    weekTitle = week?.title ?? null;
  }

  return (
    <div className="space-y-8">
      <section className="max-w-2xl space-y-4">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-focus">
          Phase 1 — Foundation
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Build in public. Ship on Fridays.
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">
          Momentum is the cohort&apos;s shipping engine: horizontal assembly lines,
          radar-style pulse, and a slot machine for the next win—without the Jira
          energy leak.
        </p>
      </section>

      {session?.user ? (
        <section className="grid gap-4 rounded border border-surface-border bg-surface-raised/60 p-5 md:grid-cols-2">
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              Cohort
            </div>
            <div className="mt-1 font-mono text-lg text-ship">
              {cohortName ?? "Assigning cohort…"}
            </div>
          </div>
          <div>
            <div className="font-mono text-[11px] font-bold uppercase tracking-wide text-ink-muted">
              Active week
            </div>
            <div className="mt-1 font-sans text-lg text-ink">
              {weekTitle ?? "Run db seed"}
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded border border-dashed border-surface-border bg-surface-muted/40 p-6">
          <p className="text-sm text-ink-muted">
            Sign in with GitHub to attach your principal to the single cohort model,
            streak fields, and audit-ready task rows (Phase 3–4 wire the slot and
            ship loop).
          </p>
        </section>
      )}
    </div>
  );
}
