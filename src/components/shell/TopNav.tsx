import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { signIn, signOut } from "@/auth";
import { MotionToggle } from "./MotionToggle";

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
          <div className="relative hidden md:block max-w-xs w-full mr-4">
            <input type="text" placeholder="Search..." className="w-full bg-surface-raised border border-surface-border rounded-md py-1.5 px-3 text-sm text-ink placeholder:text-ink-muted focus:border-ship focus:outline-none focus:ring-1 focus:ring-ship transition-colors" />
          </div>

          <button className="text-ink-muted hover:text-ink transition-colors">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
          </button>
          
          <MotionToggle />

          {session?.user ? (
            <>
              <div
                className="flex items-center gap-2 rounded border border-surface-border bg-surface-raised/80 px-2 py-1 font-mono text-sm text-ship shadow-ship"
                title="Current streak (weekday rules apply on ship)"
              >
                <span aria-hidden>🔥</span>
                <span className="tabular-nums">{streak}</span>
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
                <span className="hidden max-w-[140px] truncate text-sm text-ink md:inline">
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
