import { auth } from "@/auth";
import { getCohortDashboard } from "@/lib/cohort-dashboard";
import { AssemblyLine } from "@/components/assembly-line/AssemblyLine";

export default async function AssemblyPage() {
  const session = await auth();
  const dashboard = session?.user?.id ? await getCohortDashboard(session.user.id) : null;

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="space-y-1">
          <h1 className="font-sans text-3xl font-bold tracking-tight text-ink md:text-5xl">
            Assembly Line
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-focus shadow-[0_0_8px_rgba(0,240,255,0.8)]" />
            <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
              Conveyor belt tracker. Watch work flow from intake to shipped.
            </p>
          </div>
        </div>
        
        {dashboard && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface-container-high border border-surface-border px-3 py-1.5 rounded font-mono text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <span>TOTAL_TASKS:</span>
              <span className="text-ink">{dashboard.tasks.length}</span>
            </div>
            <div className="flex items-center gap-2 bg-[#003300]/20 border border-ship/30 px-3 py-1.5 rounded font-mono text-[11px] font-bold text-ship uppercase tracking-wider">
              <span>SHIPPED:</span>
              <span>{dashboard.weekShippedCount}</span>
            </div>
          </div>
        )}
      </section>

      {session?.user && dashboard ? (
        <AssemblyLine tasks={dashboard.tasks} members={dashboard.members} viewerUserId={session.user.id} />
      ) : (
        <p className="text-sm text-ink-muted">Sign in to view the assembly line for your cohort.</p>
      )}
    </div>
  );
}
