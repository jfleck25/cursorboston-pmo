import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

let devAuthSecretWarned = false;

function resolveAuthSecret(): string | undefined {
  const fromEnv =
    process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    if (!devAuthSecretWarned) {
      devAuthSecretWarned = true;
      console.warn(
        "[auth] AUTH_SECRET (or NEXTAUTH_SECRET) is unset — using a dev-only placeholder. Add AUTH_SECRET to .env (see .env.example).",
      );
    }
    return "momentum-dev-auth-secret-not-for-production";
  }

  return undefined;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: resolveAuthSecret(),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID ?? "__MISSING_GITHUB_CLIENT_ID__",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "__MISSING_GITHUB_CLIENT_SECRET__",
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const cohort = await prisma.cohort.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (cohort) {
        await prisma.user.update({
          where: { id: user.id },
          data: { cohortId: cohort.id },
        });
      }
    },
  },
  trustHost: true,
});
