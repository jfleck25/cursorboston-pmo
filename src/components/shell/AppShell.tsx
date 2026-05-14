import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { ShellClient } from "./ShellClient";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();

  const githubAuthReady =
    Boolean(process.env.GITHUB_CLIENT_ID) &&
    Boolean(process.env.GITHUB_CLIENT_SECRET);

  let streak = 0;
  let displayName: string | null = null;
  let avatarUrl: string | null = null;

  if (session?.user?.id) {
    const u = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        currentStreak: true,
        name: true,
        image: true,
      },
    });
    streak = u?.currentStreak ?? 0;
    displayName = u?.name ?? session.user.name ?? null;
    avatarUrl = u?.image ?? session.user.image ?? null;
  }

  return (
    <div className="flex h-dvh bg-surface text-ink overflow-hidden">
      <Sidebar avatarUrl={avatarUrl} />
      <div className="flex flex-1 flex-col overflow-hidden ml-64">
        <TopNav
          session={session}
          streak={streak}
          displayName={displayName}
          avatarUrl={avatarUrl}
          githubAuthReady={githubAuthReady}
        />
        <main className="mx-auto w-full max-w-[1440px] flex-1 overflow-y-auto px-4 py-8 md:px-8">
          {children}
        </main>
        {/* Render floating variant for small screens or keep it in sidebar? For now, sidebar handles it. */}
      </div>
    </div>
  );
}
