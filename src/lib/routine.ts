/** Pure helpers for the morning launchpad, clubs, countdowns and ambient weather. */

export type MorningTask = { id: string; title: string; emoji: string; person: string };
export type Club = { id: string; person: string; title: string; day: number; start: string; end: string; when: "before" | "after"; kit: string; pickup: string };
/** Countdown settings, keyed by entry name (birthday name or festival name). */
export type CountdownRule = { days: number };

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export const toMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };

/** True between start (inclusive) and end (exclusive); weekends only when allowed. */
export function isMorningWindow(now: Date, start: string, end: string, weekends: boolean) {
  const weekend = now.getDay() === 0 || now.getDay() === 6;
  if (weekend && !weekends) return false;
  const m = now.getHours() * 60 + now.getMinutes();
  return m >= toMinutes(start) && m < toMinutes(end);
}

/** Days from today until a date given as ISO "2026-10-20" or "20 OCT" (next occurrence). */
export function daysUntil(date: string, now: Date): number | null {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let target: Date | null = null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (iso) target = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const short = /^(\d{1,2})\s+([A-Za-z]{3})/.exec(date);
  if (!target && short) {
    const mi = MONTHS.indexOf((short[2] ?? "").toUpperCase());
    if (mi < 0) return null;
    target = new Date(today.getFullYear(), mi, Number(short[1]));
    if (target < today) target.setFullYear(today.getFullYear() + 1);
  }
  if (!target) return null;
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

/** A countdown shows when the entry is on, and today is within its window (0..days). */
export function countdownLabel(daysAway: number | null, rule: CountdownRule | undefined): string | null {
  if (!rule || daysAway === null || daysAway < 0 || daysAway > rule.days) return null;
  if (daysAway === 0) return "Today!";
  if (daysAway === 1) return "Tomorrow!";
  return `In ${daysAway} days`;
}

/** Clothing advice from the day's temperatures and weather code (Open-Meteo WMO codes). */
export function dressAdvice(tempC: number, highC: number, code: number): { title: string; items: string[] } {
  const wet = (code >= 51 && code < 71) || (code >= 80 && code < 85) || code >= 95;
  const snow = (code >= 71 && code <= 77) || code === 85 || code === 86;
  const items: string[] = [];
  let title: string;
  if (snow || tempC <= 3) { title = "Frosty — wrap up warm"; items.push("Thick coat", "Hat, gloves & scarf", "Warm socks"); }
  else if (tempC <= 9) { title = "Chilly morning"; items.push("Warm coat", "Jumper underneath"); }
  else if (tempC <= 15) { title = "Cool start"; items.push("Light jacket or hoodie"); }
  else if (tempC <= 21) { title = "Mild day"; items.push("Long sleeves, light layer"); }
  else { title = "Warm and sunny"; items.push("T-shirt", "Sun cream", "Sun hat"); }
  if (wet) items.unshift("Raincoat & wellies", "Umbrella");
  if (snow) items.unshift("Snow boots");
  if (highC - tempC >= 7 && !snow) items.push(`Warmer later (${Math.round(highC)}°) — easy-off layers`);
  if (code >= 95) title = "Stormy — " + title.toLowerCase();
  else if (wet) title = "Wet — " + title.toLowerCase();
  return { title, items };
}

/** Clubs on the given weekday (0 = Monday), earliest first. */
export function clubsForDay(clubs: Club[], day: number) {
  return clubs.filter((c) => c.day === day).sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
}

/** Which ambient overlay a weather code calls for. */
export function ambientKind(code: number): "rain" | "snow" | "storm" | null {
  if (code >= 95) return "storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 51) return "rain";
  return null;
}

export const localDateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** A wheelie bin. `start` is any ISO date it was (or will be) collected — it sets the fortnight/4-week rhythm. */
export type Bin = { id: string; name: string; emoji: string; color: string; every: 1 | 2 | 4; start: string;
  /** Exact collection dates fetched from the council; when present they replace the repeating rule. */
  dates?: string[]; council?: boolean };

const dayNumber = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
const isoDay = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1); };

/** True when the bin is collected on that date: same weekday as its start date, every 1, 2 or 4 weeks. */
export function binDue(bin: Bin, date: Date) {
  if (bin.dates?.length) return bin.dates.includes(localDateKey(date));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bin.start)) return false;
  const diff = dayNumber(date) - dayNumber(isoDay(bin.start));
  const cycle = 7 * bin.every;
  return ((diff % cycle) + cycle) % cycle === 0;
}

export const binsOn = (bins: Bin[] = [], date: Date) => bins.filter((b) => binDue(b, date));

/** Next collection date for a bin, from today (inclusive). */
export function nextBinDate(bin: Bin, now: Date) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < 60; i++) { if (binDue(bin, d)) return d; d.setDate(d.getDate() + 1); }
  return null;
}

/** What the frame should nudge about: bins today (until noon), or tomorrow's bins from the evening. */
export function binReminder(bins: Bin[] = [], now: Date, eveningFrom: string): { when: "today" | "tonight"; bins: Bin[] } | null {
  const m = now.getHours() * 60 + now.getMinutes();
  const today = binsOn(bins, now);
  if (today.length && m < 12 * 60) return { when: "today", bins: today };
  if (m >= toMinutes(eveningFrom)) {
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrow = binsOn(bins, t);
    if (tomorrow.length) return { when: "tonight", bins: tomorrow };
  }
  return null;
}

/** Day / evening look of the frame. Night (the sleep clock) is handled separately. */
export function dayPhase(now: Date, look: "auto" | "day" | "evening", eveningStart: string, morningEnd: string): "day" | "evening" {
  if (look !== "auto") return look;
  const m = now.getHours() * 60 + now.getMinutes();
  return m >= toMinutes(eveningStart) || m < toMinutes(morningEnd) ? "evening" : "day";
}

/** A family member. Everything (jobs, clubs, chores, events, calendars) refers to members by name. */
export type MemberTheme = "none" | "spiderman" | "unicorn";
export type Member = { id: string; name: string; icon: string; color: string; kid: boolean; theme: MemberTheme };

export const defaultMembers: Member[] = [
  { id: "m1", name: "Da", icon: "👨", color: "#3b82f6", kid: false, theme: "none" },
  { id: "m2", name: "Mum", icon: "👩", color: "#10b981", kid: false, theme: "none" },
  { id: "m3", name: "Aariv", icon: "🕷️", color: "#dc2626", kid: true, theme: "spiderman" },
  { id: "m4", name: "Arika", icon: "🦄", color: "#a855f7", kid: true, theme: "unicorn" },
];

/** "Family" (or any unknown name) gets a shared look so older entries never break. */
export function findMember(members: Member[] = [], name: string): Member {
  return members.find((m) => m.name.toLowerCase() === name.toLowerCase()) ?? { id: "family", name: name || "Family", icon: "🏠", color: "#eab308", kid: false, theme: "none" };
}

/** Renames a member everywhere it is referenced inside the display settings. */
export function renameMember<S extends { morningTasks: MorningTask[]; clubs: Club[]; countdowns: Record<string, CountdownRule> }>(s: S, from: string, to: string): Pick<S, "morningTasks" | "clubs" | "countdowns"> {
  const swap = (n: string) => (n === from ? to : n);
  const countdowns = Object.fromEntries(Object.entries(s.countdowns).map(([k, v]) => [swap(k), v]));
  return {
    morningTasks: s.morningTasks.map((t) => ({ ...t, person: swap(t.person) })),
    clubs: s.clubs.map((c) => ({ ...c, person: swap(c.person), pickup: swap(c.pickup) })),
    countdowns,
  };
}

/** Sunset chip: before sunset "Sunset 18:24 · 2h 10m light left", after it "First light 07:12". */
export function daylightLabel(now: Date, sunrise?: string, sunset?: string): string | null {
  if (!sunrise || !sunset) return null;
  const m = now.getHours() * 60 + now.getMinutes();
  const rise = toMinutes(sunrise), set = toMinutes(sunset);
  if (m < rise) return `First light ${sunrise}`;
  if (m >= set) return `Sunset was ${sunset} · first light ${sunrise}`;
  const left = set - m;
  const h = Math.floor(left / 60), mm = left % 60;
  return `Sunset ${sunset} · ${h ? `${h}h ` : ""}${mm}m light left`;
}
