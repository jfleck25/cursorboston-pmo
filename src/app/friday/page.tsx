import { auth } from "@/auth";
import { FridayLaunchGrid } from "@/components/friday-launch/FridayLaunchGrid";
import { getFridayLaunch } from "@/lib/friday-launch";

export default async function FridayPage() {
  const session = await auth();
  const data = session?.user?.id ? await getFridayLaunch(session.user.id) : null;

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="space-y-1">
          <h1 className="font-sans text-3xl font-bold tracking-tight text-ink md:text-5xl">
            Live Voting Board
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-ship shadow-[0_0_8px_rgba(0,255,102,0.8)]" />
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              Cycle {data?.weekTitle ?? "42"} Active. Ship or die trying.
            </p>
          </div>
        </div>
        
        {data && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface-container-high border border-surface-border px-3 py-1.5 rounded font-mono text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <span>TOTAL_SHIPS:</span>
              <span className="text-ink">{data.tasks.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#004f54]/20 border border-focus/30 px-3 py-1.5 rounded font-mono text-[11px] font-bold text-focus uppercase tracking-wider">
              <span>TIME_REMAINING:</span>
              <span>04:12:00</span>
            </div>
          </div>
        )}
      </section>

      {session?.user && data ? (
        <>

          <FridayLaunchGrid tasks={data.tasks} viewerUserId={session.user.id} />
        </>
      ) : (
        <p className="text-sm text-ink-muted">Sign in to load the Friday board for your cohort.</p>
      )}
    </div>
  );
}
