import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
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
