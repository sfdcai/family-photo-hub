import ical from "node-ical";

let cache = { at: 0, spec: "", events: [] };
export const lastCalendarErrors = new Map();

/**
 * ICAL_URLS = "Person|https://...ics,Person2|webcal://..." (iCloud shared calendar public links).
 * Returns this week's events (Mon=0) as read-only frame events.
 */
export async function calendarEvents(spec, now = new Date()) {
  if (!spec) return [];
  if (cache.spec === spec && Date.now() - cache.at < 10 * 60_000) return cache.events;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday.getTime() + 7 * 86_400_000);
  const out = [];
  for (const entry of spec.split(",").map((s) => s.trim()).filter(Boolean)) {
    const [person, rawUrl] = entry.includes("|") ? entry.split("|") : ["Family", entry];
    try {
      const data = await ical.async.fromURL(rawUrl.replace(/^webcal:/, "https:"));
      for (const ev of Object.values(data)) {
        if (ev.type !== "VEVENT") continue;
        const starts = ev.rrule ? ev.rrule.between(monday, sunday, true) : [ev.start];
        for (const s of starts) {
          const start = new Date(s);
          if (start < monday || start >= sunday) continue;
          out.push({
            id: `ical-${ev.uid}-${start.getTime()}`,
            day: (start.getDay() + 6) % 7,
            time: ev.datetype === "date" ? "All day" : start.toTimeString().slice(0, 5),
            title: ev.summary || "Event",
            person: person.trim(),
            kind: "event",
            readOnly: true,
          });
        }
      }
      lastCalendarErrors.delete(person.trim());
    } catch (err) { console.warn("calendar failed", person, err.message); lastCalendarErrors.set(person.trim(), err.message); }
  }
  cache = { at: Date.now(), spec, events: out };
  return out;
}
