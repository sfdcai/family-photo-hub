import { readFileSync } from "node:fs";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
let ukCache = { at: 0, list: [] };

async function ukBankHolidays() {
  if (Date.now() - ukCache.at < 24 * 3_600_000 && ukCache.list.length) return ukCache.list;
  try {
    const j = await (await fetch("https://www.gov.uk/bank-holidays.json")).json();
    const region = j[process.env.UK_REGION || "england-and-wales"];
    ukCache = { at: Date.now(), list: region.events.map((e) => ({ date: e.date, name: e.title, kind: "UK bank holiday" })) };
  } catch (err) { console.warn("gov.uk holidays failed", err.message); }
  return ukCache.list;
}

/** Combined upcoming UK, Indian and Hindu dates, soonest first. */
export async function upcomingFestivals(file, today = new Date(), limit = 8, extra = []) {
  const bundled = [...JSON.parse(readFileSync(file, "utf8")), ...extra];
  const todayIso = today.toISOString().slice(0, 10);
  const all = [...bundled, ...(await ukBankHolidays())]
    .filter((f) => f.date >= todayIso)
    .sort((a, b) => a.date.localeCompare(b.date));
  const seen = new Set();
  return all.filter((f) => { const k = f.date + f.name; if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, limit)
    .map((f) => ({ date: `${f.date.slice(8, 10)} ${MONTHS[Number(f.date.slice(5, 7)) - 1]}`, name: f.name, kind: f.kind, iso: f.date }));
}
