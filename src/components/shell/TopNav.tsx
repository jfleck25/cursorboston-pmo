import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { signIn, signOut } from "@/auth";
import { MotionToggle } from "./MotionToggle";
import { CountdownTimer } from "./CountdownTimer";

type TopNavProps = {
  session: Session | null;
  streak: number;
  displayName: string | null;
  avatarUrl: string | null;
  githubAuthReady: boolean;
};

export function TopNav({
  session,
  streak,
  displayName,
  avatarUrl,
  githubAuthReady,
}: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-8">
        <div className="flex items-center gap-3 w-1/3">
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-1 justify-end">
          <CountdownTimer />
          
          <MotionToggle />

          {session?.user ? (
            <>
              <div
                className="flex items-center gap-2 rounded border border-surface-border bg-surface-raised/80 px-2 py-1 font-mono text-sm text-ship shadow-ship"
                title="Current streak (weekday rules apply on ship)"
              >
                <span className="tabular-nums">{streak} SHIPS</span>
              </div>

              <div className="flex items-center gap-2">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-[4px] border border-surface-border object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-[4px] border border-surface-border bg-surface-muted font-mono text-xs text-ink-muted">
                    {(displayName ?? session.user.email ?? "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </div>
                )}
                <span className="hidden max-w-[200px] truncate text-sm text-ink md:inline" title={displayName ?? session.user.email ?? ""}>
                  {displayName ?? session.user.email}
                </span>
              </div>

              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="rounded border border-surface-border px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide text-ink-muted transition hover:border-focus hover:text-focus"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {githubAuthReady ? (
                <form
                  action={async () => {
                    "use server";
                    await signIn("github", { redirectTo: "/" });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded border border-github/60 bg-surface-raised px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wide text-github transition hover:border-github hover:shadow-[0_0_12px_rgba(163,113,247,0.25)]"
                  >
                    Sign in with GitHub
                  </button>
                </form>
              ) : (
                <span className="font-mono text-xs text-danger">
                  Set GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
