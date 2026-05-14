import { PrismaClient } from "@prisma/client";

const dbUrl = process.env.DATABASE_URL?.trim();
if (!dbUrl && process.env.NODE_ENV === "development") {
  console.warn(
    "[prisma] DATABASE_URL is missing or empty — GitHub sign-in will fail until you set a Postgres URL in .env (see .env.example).",
  );
}
if (dbUrl && !/^postgres(ql)?:\/\//i.test(dbUrl)) {
  throw new Error(
    `[prisma] DATABASE_URL must start with postgresql:// or postgres:// (Prisma Postgres datasource). ` +
      `Update .env — see .env.example. Received (first 60 chars): ${JSON.stringify(dbUrl.slice(0, 60))}`,
  );
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
