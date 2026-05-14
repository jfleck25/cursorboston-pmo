import { auth } from "@/auth";
import { FridayLaunchGrid } from "@/components/phase2/FridayLaunchGrid";
import { getFridayLaunch } from "@/lib/friday-launch";

export default async function FridayPage() {
  const session = await auth();
  const data = session?.user?.id ? await getFridayLaunch(session.user.id) : null;

  return (
    <div className="space-y-8">
      <section className="max-w-2xl space-y-3">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-focus">
          Phase 4 · Friday launch
        </p>
        <h1 className="font-sans text-3xl font-bold tracking-tight text-ink md:text-4xl">
          Showcase wall
        </h1>
        <p className="text-base leading-relaxed text-ink-muted">
          Masonry of everything the cohort shipped this active week—upvote the builds that
          inspired you (one toggle per task, rate-limited).
        </p>
      </section>

      {session?.user && data ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4 rounded border border-surface-border bg-surface-raised/50 p-4">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase text-ink-muted">Cohort</div>
              <div className="font-mono text-lg text-ship">{data.cohortName}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold uppercase text-ink-muted">Week</div>
              <div className="font-sans text-lg text-ink">{data.weekTitle}</div>
            </div>
          </div>
          <FridayLaunchGrid tasks={data.tasks} viewerUserId={session.user.id} />
        </>
      ) : (
        <p className="text-sm text-ink-muted">Sign in to load the Friday board for your cohort.</p>
      )}
    </div>
  );
}
