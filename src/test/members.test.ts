import { describe, expect, it } from "vitest";
import { daylightLabel, defaultMembers, findMember, renameMember } from "@/lib/routine";

describe("family members", () => {
  it("has Da, Mum, Aariv and Arika with their themes", () => {
    expect(defaultMembers.map((m) => m.name)).toEqual(["Da", "Mum", "Aariv", "Arika"]);
    expect(findMember(defaultMembers, "Aariv").theme).toBe("spiderman");
    expect(findMember(defaultMembers, "arika").theme).toBe("unicorn");
  });
  it("falls back to a family look for unknown names", () => {
    expect(findMember(defaultMembers, "Family").id).toBe("family");
  });
  it("renames jobs, clubs, pickups and countdowns", () => {
    const r = renameMember({ morningTasks: [{ id: "t", title: "x", emoji: "", person: "Da" }], clubs: [{ id: "c", person: "Aariv", title: "", day: 0, start: "", end: "", when: "after", kit: "", pickup: "Da" }], countdowns: { Da: { days: 7 } } }, "Da", "Dad");
    expect(r.morningTasks[0]!.person).toBe("Dad");
    expect(r.clubs[0]!.pickup).toBe("Dad");
    expect(r.countdowns.Dad).toEqual({ days: 7 });
  });
});

describe("daylight", () => {
  it("shows light left before sunset", () => {
    expect(daylightLabel(new Date(2026, 9, 11, 16, 14), "07:20", "18:24")).toBe("Sunset 18:24 · 2h 10m light left");
  });
  it("shows first light before sunrise", () => {
    expect(daylightLabel(new Date(2026, 9, 11, 6, 0), "07:20", "18:24")).toBe("First light 07:20");
  });
});
