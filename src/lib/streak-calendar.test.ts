import { describe, expect, it } from "vitest";

import { getPreviousEligibleLocalDate, localDateStringInTimeZone } from "./streak-calendar";

describe("streak-calendar", () => {
  it("maps UTC instant to Chicago local date", () => {
    const d = new Date("2026-05-11T14:00:00.000Z");
    expect(localDateStringInTimeZone(d, "America/Chicago")).toBe("2026-05-11");
  });

  it("returns previous Friday from a Monday in Chicago", () => {
    const mon = new Date("2026-05-11T14:00:00.000Z");
    expect(getPreviousEligibleLocalDate(mon, "America/Chicago")).toBe("2026-05-08");
  });
});
