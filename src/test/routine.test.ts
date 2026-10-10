import { describe, expect, it } from "vitest";

import { clubsForDay, countdownLabel, daysUntil, dressAdvice, isMorningWindow } from "@/lib/routine";

const mon = new Date(2026, 9, 12, 7, 30); // Monday 07:30
describe("morning launchpad window", () => {
  it("shows between start and end on school days", () => expect(isMorningWindow(mon, "06:30", "09:00", false)).toBe(true));
  it("switches back to photos at 9am", () => expect(isMorningWindow(new Date(2026, 9, 12, 9, 0), "06:30", "09:00", false)).toBe(false));
  it("stays off at weekends unless enabled", () => {
    const sat = new Date(2026, 9, 10, 7, 30);
    expect(isMorningWindow(sat, "06:30", "09:00", false)).toBe(false);
    expect(isMorningWindow(sat, "06:30", "09:00", true)).toBe(true);
  });
});

describe("countdowns", () => {
  it("counts days to a festival date", () => expect(daysUntil("2026-10-20", mon)).toBe(8));
  it("reads short dates like 08 NOV", () => expect(daysUntil("08 NOV", mon)).toBe(27));
  it("only shows inside the chosen window", () => {
    expect(countdownLabel(8, { days: 7 })).toBeNull();
    expect(countdownLabel(5, { days: 7 })).toBe("In 5 days");
    expect(countdownLabel(5, undefined)).toBeNull();
  });
});

describe("dress advice", () => {
  it("asks for raincoats on rainy days", () => expect(dressAdvice(11, 13, 61).items).toContain("Raincoat & wellies"));
  it("asks for gloves when frosty", () => expect(dressAdvice(2, 4, 0).items).toContain("Hat, gloves & scarf"));
});

describe("clubs", () => {
  it("lists only today's clubs, earliest first", () => {
    const base = { person: "Maya", end: "", when: "after" as const, kit: "", pickup: "" };
    const list = clubsForDay([{ ...base, id: "a", title: "Swim", day: 0, start: "15:30" }, { ...base, id: "b", title: "Breakfast", day: 0, start: "07:45" }, { ...base, id: "c", title: "Piano", day: 2, start: "16:00" }], 0);
    expect(list.map((c) => c.title)).toEqual(["Breakfast", "Swim"]);
  });
});
