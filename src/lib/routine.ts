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
    const mi = MONTHS.indexOf(short[2].toUpperCase());
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
