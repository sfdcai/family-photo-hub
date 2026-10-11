import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/**
 * Council bin dates from the community `waste_collection_schedule` scrapers (Python),
 * run as a child process. Results become `Settings.bins` entries with exact `dates`.
 */
const script = join(dirname(fileURLToPath(import.meta.url)), "..", "waste", "fetch_bins.py");
export const wasteStatus = { ok: false, detail: "", at: "" };

function run(args) {
  return new Promise((resolve, reject) => {
    execFile(process.env.PYTHON || "python3", [script, ...args], { timeout: 90_000, maxBuffer: 8e6 }, (err, stdout) => {
      let out; try { out = JSON.parse(stdout || "null"); } catch { /* not json */ }
      if (out?.error) return reject(new Error(out.error));
      if (err) return reject(new Error(err.code === "ENOENT" ? "Python isn't installed in this container" : err.message));
      resolve(out);
    });
  });
}

let sourcesCache = null;
export async function wasteSources() { sourcesCache ??= await run(["list", "uk"]); return sourcesCache; }
export const fetchCollections = (source, args) => run(["fetch", JSON.stringify({ source, args })]);

const looks = [
  [/food|caddy|kitchen/i, "🍎", "#16a34a"], [/garden|green waste/i, "🌿", "#65a30d"], [/glass/i, "🍾", "#0891b2"],
  [/recycl|paper|card|plastic|blue/i, "♻️", "#2563eb"], [/textile|battery|electric/i, "🔋", "#f59e0b"], [/./, "🗑️", "#3f3f46"],
];

/** Groups dated collections into bins, keeping any emoji/colour the family already chose for that bin name. */
export function binsFromCollections(rows, existing = []) {
  const byType = new Map();
  for (const r of rows) { if (!byType.has(r.type)) byType.set(r.type, []); byType.get(r.type).push(r.date); }
  return [...byType].map(([name, dates], i) => {
    const prev = existing.find((b) => b.name === name);
    const [, emoji, color] = looks.find(([re]) => re.test(name));
    return { id: prev?.id ?? `council-${i}-${name.toLowerCase().replace(/\W+/g, "-")}`, name, emoji: prev?.emoji ?? emoji, color: prev?.color ?? color,
      every: prev?.every ?? 2, start: dates[0], dates: [...new Set(dates)].sort(), council: true };
  });
}

/** Fetches council dates and replaces council bins in settings (hand-made bins stay). Old dates survive a failed fetch. */
export async function syncWaste(cfg, db, broadcast) {
  if (!cfg.wasteSource) return;
  try {
    const rows = await fetchCollections(cfg.wasteSource, cfg.wasteArgs || {});
    if (!rows.length) throw new Error("The council returned no upcoming collections");
    const s = db.settings();
    const manual = (s.bins || []).filter((b) => !b.council);
    db.setSettings({ ...s, bins: [...manual, ...binsFromCollections(rows, s.bins || [])] });
    Object.assign(wasteStatus, { ok: true, detail: `${rows.length} collections from the council`, at: new Date().toISOString() });
    broadcast();
  } catch (err) {
    Object.assign(wasteStatus, { ok: false, detail: err.message, at: new Date().toISOString() });
    console.warn("waste sync failed", err.message);
  }
}
