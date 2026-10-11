import { describe, expect, it } from "vitest";
import { binDue, binReminder, dayPhase, type Bin } from "@/lib/routine";

const recycling: Bin = { id: "r", name: "Recycling", emoji: "♻️", color: "#00f", every: 2, start: "2026-10-13" };
const food: Bin = { id: "f", name: "Food", emoji: "🍎", color: "#0f0", every: 1, start: "2026-10-13" };

describe("bins", () => {
  it("fortnightly bin is due on its week, not the week between", () => {
    expect(binDue(recycling, new Date(2026, 9, 27))).toBe(true);
    expect(binDue(recycling, new Date(2026, 9, 20))).toBe(false);
    expect(binDue(recycling, new Date(2026, 8, 29))).toBe(true);
  });
  it("weekly bin is due every same weekday", () => expect(binDue(food, new Date(2026, 9, 20))).toBe(true));
  it("reminds the evening before from 18:00", () => {
    expect(binReminder([food], new Date(2026, 9, 19, 18, 0), "18:00")?.when).toBe("tonight");
    expect(binReminder([food], new Date(2026, 9, 19, 17, 0), "18:00")).toBeNull();
  });
  it("shows today until noon", () => expect(binReminder([food], new Date(2026, 9, 20, 7, 0), "18:00")?.when).toBe("today"));
});

describe("day phase", () => {
  it("evening from 19:00 until the morning ends", () => {
    expect(dayPhase(new Date(2026, 9, 20, 19, 30), "auto", "19:00", "09:00")).toBe("evening");
    expect(dayPhase(new Date(2026, 9, 20, 12, 0), "auto", "19:00", "09:00")).toBe("day");
    expect(dayPhase(new Date(2026, 9, 20, 12, 0), "evening", "19:00", "09:00")).toBe("evening");
  });
});
