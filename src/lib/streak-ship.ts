import type { Prisma } from "@prisma/client";

import {
  getPreviousEligibleLocalDate,
  isWeekendInTimeZone,
  localDateStringInTimeZone,
} from "@/lib/streak-calendar";

export type UserStreakFields = {
  currentStreak: number;
  highestStreak: number;
  lastStreakIncrementLocalDate: string | null;
};

async function countShipEventsOnLocalDate(
  tx: Prisma.TransactionClient,
  userId: string,
  localYmd: string,
  cohortTimezone: string,
): Promise<number> {
  const rows = await tx.shipEvent.findMany({
    where: { userId },
    select: { shippedAt: true },
  });
  return rows.filter(
    (r) => localDateStringInTimeZone(r.shippedAt, cohortTimezone) === localYmd,
  ).length;
}

/**
 * Streak updates for the **actor** (user performing ship), keyed off `ShipEvent` history.
 * Weekends never change streak counters; at most one increment per local weekday.
 */
export async function resolveStreakUpdateForShip(args: {
  tx: Prisma.TransactionClient;
  actorUserId: string;
  cohortTimezone: string;
  now: Date;
  before: UserStreakFields;
}): Promise<{ streak: UserStreakFields; lastShipAt: Date }> {
  const { tx, actorUserId, cohortTimezone, now, before } = args;
  const lastShipAt = now;

  if (isWeekendInTimeZone(now, cohortTimezone)) {
    return {
      lastShipAt,
      streak: { ...before },
    };
  }

  const todayLocal = localDateStringInTimeZone(now, cohortTimezone);
  const shipsTodayBeforeThis = await countShipEventsOnLocalDate(
    tx,
    actorUserId,
    todayLocal,
    cohortTimezone,
  );
  if (shipsTodayBeforeThis > 0) {
    return { lastShipAt, streak: { ...before } };
  }

  const prevEligible = getPreviousEligibleLocalDate(now, cohortTimezone);
  const hadShipPrev =
    (await countShipEventsOnLocalDate(tx, actorUserId, prevEligible, cohortTimezone)) > 0;

  let nextStreak: number;
  if (!hadShipPrev) {
    nextStreak = 1;
  } else if (before.lastStreakIncrementLocalDate === prevEligible) {
    nextStreak = before.currentStreak + 1;
  } else {
    nextStreak = 1;
  }

  const streak: UserStreakFields = {
    currentStreak: nextStreak,
    highestStreak: Math.max(before.highestStreak, nextStreak),
    lastStreakIncrementLocalDate: todayLocal,
  };

  return { lastShipAt, streak };
}
