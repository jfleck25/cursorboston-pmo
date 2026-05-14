/**
 * Cohort-local calendar helpers for streak rules (IANA zone, e.g. America/Chicago).
 */

export function localDateStringInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isWeekendInTimeZone(date: Date, timeZone: string): boolean {
  const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return wd === "Sat" || wd === "Sun";
}

/**
 * Latest local calendar date strictly before `now` in `timeZone` that is Mon–Fri.
 */
export function getPreviousEligibleLocalDate(now: Date, timeZone: string): string {
  const todayStr = localDateStringInTimeZone(now, timeZone);
  for (let h = 1; h < 24 * 21; h++) {
    const probe = new Date(now.getTime() - h * 3_600_000);
    const ymd = localDateStringInTimeZone(probe, timeZone);
    if (ymd >= todayStr) continue;
    if (isWeekendInTimeZone(probe, timeZone)) continue;
    return ymd;
  }
  throw new Error("getPreviousEligibleLocalDate: no eligible day in search window");
}
