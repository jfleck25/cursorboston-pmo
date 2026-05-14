import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TopNav } from "./TopNav";
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
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <TopNav
        session={session}
        streak={streak}
        displayName={displayName}
        avatarUrl={avatarUrl}
        githubAuthReady={githubAuthReady}
      />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-8 md:px-8">
        {children}
      </main>
      <ShellClient />
    </div>
  );
}
