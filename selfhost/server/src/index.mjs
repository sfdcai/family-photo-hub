import { createServer, request as httpRequest } from "node:http";
import { createHmac, timingSafeEqual, scryptSync, randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { openDb } from "./db.mjs";
import { birthdayInfo } from "./birthdays.mjs";
import { getWeather } from "./weather.mjs";
import { upcomingFestivals } from "./festivals.mjs";
import { calendarEvents, lastCalendarErrors } from "./calendar.mjs";
import { listPhotos, photoBytes, clearPhotoCache, liveVideo } from "./photos.mjs";
import { immichFetch, resetImmichSession } from "./immich.mjs";
import { weatherStatus } from "./weather.mjs";
import { syncWaste, wasteSources, fetchCollections, binsFromCollections, wasteStatus } from "./waste.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const env = process.env;
const base = {
  port: Number(env.PORT || 8080),
  uiOrigin: env.UI_ORIGIN || "http://127.0.0.1:3000",
  pin: env.FAMILY_PIN || "",
  secret: env.SESSION_SECRET || "change-me",
  lat: env.LATITUDE || "51.5072", lon: env.LONGITUDE || "-0.1276", place: env.PLACE_NAME || "London",
  icalUrls: env.ICAL_URLS || "",
  immichUrl: (env.IMMICH_URL || "").replace(/\/$/, ""), immichKey: env.IMMICH_API_KEY || "",
  immichPeople: env.IMMICH_PERSON_IDS || "", immichAlbums: env.IMMICH_ALBUM_IDS || "",
  photoDir: env.PHOTO_DIR || "/photos/local", googleDir: env.GOOGLE_PHOTOS_DIR || "/photos/google",
  festivalsFile: env.FESTIVALS_FILE || join(here, "..", "festivals.json"),
  immichEmail: env.IMMICH_EMAIL || "", immichPassword: env.IMMICH_PASSWORD || "",
  googleAlbum: env.GOOGLE_ALBUM || "", localFolder: false, customFestivals: [], adminHash: "", sessionGen: 0,
};
const db = openDb(env.DB_FILE || "/data/family.db");
const SECRETS = ["immichPassword", "immichKey", "familyPin", "adminPassword"];
/** Effective configuration: .env values overridden by whatever was saved in the admin panel. */
function conf() {
  const c = db.config();
  const o = { ...base, ...c };
  if (Array.isArray(c.immichAlbums)) o.immichAlbums = c.immichAlbums.join(",");
  if (Array.isArray(c.immichPeople)) o.immichPeople = c.immichPeople.join(",");
  if (Array.isArray(c.calendars)) o.icalUrls = c.calendars.filter((x) => x.url).map((x) => `${x.person || "Family"}|${x.url}`).join(",");
  if (c.familyPin !== undefined) o.pin = c.familyPin;
  return o;
}
const toList = (v) => (Array.isArray(v) ? v : String(v || "").split(",").map((x) => x.trim()).filter(Boolean));
/** What the admin panel sees: secrets only as { set }. */
function publicConfig() {
  const c = conf();
  return {
    immichUrl: c.immichUrl, immichEmail: c.immichEmail, immichAlbums: toList(c.immichAlbums), immichPeople: toList(c.immichPeople),
    googleAlbum: c.googleAlbum, localFolder: !!c.localFolder, place: c.place, lat: String(c.lat), lon: String(c.lon),
    calendars: c.calendars ?? toList(c.icalUrls).map((e) => { const [person, url] = e.includes("|") ? e.split("|") : ["Family", e]; return { person, url }; }),
    customFestivals: c.customFestivals ?? [],
    wasteSource: c.wasteSource || "", wasteArgs: c.wasteArgs || {},
    immichPassword: { set: !!c.immichPassword }, immichKey: { set: !!c.immichKey }, familyPin: { set: !!c.pin }, adminPassword: { set: !!c.adminHash },
  };
}
const hashPw = (pw) => { const salt = randomBytes(16).toString("hex"); return `${salt}:${scryptSync(pw, salt, 32).toString("hex")}`; };
const checkPw = (pw, stored) => { const [salt, h] = stored.split(":"); const a = scryptSync(String(pw), salt, 32); const b = Buffer.from(h, "hex"); return a.length === b.length && timingSafeEqual(a, b); };
const COLLECTIONS = new Set(["chores", "shopping", "events", "birthdays"]);
const clients = new Set();
const broadcast = (msg = String(Date.now())) => { for (const res of clients) res.write(`data: ${msg}\n\n`); };

// ---------- auth: family PIN -> signed cookie ----------
const sign = (v) => createHmac("sha256", base.secret).update(v).digest("hex");
const token = (kind) => { const v = `${kind}.${conf().sessionGen || 0}`; return `${v}.${sign(v)}`; };
function hasCookie(req, name, kind) {
  const c = new RegExp(`(?:^|;\\s*)${name}=([^;]+)`).exec(req.headers.cookie || "")?.[1];
  if (!c) return false;
  const a = Buffer.from(c), b = Buffer.from(token(kind));
  return a.length === b.length && timingSafeEqual(a, b);
}
const authed = (req) => !conf().pin || hasCookie(req, "ff_auth", "ok") || hasCookie(req, "ff_admin", "admin");
const adminAuthed = (req) => hasCookie(req, "ff_admin", "admin");

// ---------- helpers ----------
const json = (res, code, body) => { res.writeHead(code, { "content-type": "application/json", "cache-control": "no-store" }); res.end(body === undefined ? "" : JSON.stringify(body)); };
async function readBody(req) {
  let s = ""; for await (const chunk of req) { s += chunk; if (s.length > 2e7) throw new Error("too large"); }
  return s ? JSON.parse(s) : {};
}
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([k]) => !["readOnly"].includes(k)));

async function state() {
  const cfg = conf();
  const [weather, festivals, calendar] = await Promise.all([
    getWeather({ lat: cfg.lat, lon: cfg.lon, place: cfg.place }),
    upcomingFestivals(cfg.festivalsFile, new Date(), 12, cfg.customFestivals || []),
    calendarEvents(cfg.icalUrls),
  ]);
  return {
    chores: db.list("chores"),
    shopping: db.list("shopping"),
    meals: db.meals(),
    events: [...db.list("events"), ...calendar],
    birthdays: db.list("birthdays").map((b) => (b.date ? { ...b, ...birthdayInfo(b.date) } : b)),
    weather, festivals,
    settings: db.settings(),
  };
}

function proxy(req, res) {
  const target = new URL(req.url, base.uiOrigin);
  const up = httpRequest(target, { method: req.method, headers: { ...req.headers, host: target.host } }, (r) => { res.writeHead(r.statusCode || 502, r.headers); r.pipe(res); });
  up.on("error", () => { res.writeHead(502); res.end("Family Frame UI is starting…"); });
  req.pipe(up);
}

// ---------- routes ----------
async function api(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean).slice(1); // drop "api"
  const [head, id, extra] = parts;
  const m = req.method;

  const cfg = conf();
  if (head === "admin") return admin(req, res, id, extra);
  if (head === "health") return json(res, 200, { familyFrame: true, pin: !!cfg.pin, authed: authed(req) });
  if (head === "login" && m === "POST") {
    const { pin } = await readBody(req);
    if (!cfg.pin || String(pin) === cfg.pin) {
      res.setHeader("set-cookie", `ff_auth=${token("ok")}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`);
      return json(res, 200, { ok: true });
    }
    return json(res, 401, { error: "Wrong PIN" });
  }
  if (head === "state" && m === "GET") return json(res, 200, await state());
  if (head === "stream") {
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", connection: "keep-alive" });
    res.write("retry: 3000\n\n"); clients.add(res);
    const ping = setInterval(() => res.write(": ping\n\n"), 25_000);
    req.on("close", () => { clearInterval(ping); clients.delete(res); });
    return;
  }
  if (head === "photos" && m === "GET") return json(res, 200, await listPhotos(db.settings().source, cfg, db.settings().memories !== false));
  if (head === "photo" && m === "GET" && id === "live") {
    try {
      const v = await liveVideo(extra, cfg);
      res.writeHead(200, { "content-type": v.type, "content-length": v.buf.length, "cache-control": "public, max-age=604800, immutable" });
      return res.end(v.buf);
    } catch (err) { return json(res, 404, { error: err.message }); }
  }
  if (head === "photo" && m === "GET") {
    try {
      const buf = await photoBytes(id, extra, cfg);
      res.writeHead(200, { "content-type": "image/jpeg", "cache-control": "public, max-age=604800, immutable" });
      return res.end(buf);
    } catch (err) { return json(res, 404, { error: err.message }); }
  }

  // Everything below changes data and needs the family PIN.
  if (m !== "GET" && !authed(req)) return json(res, 401, { error: "PIN required" });

  if (head === "settings" && m === "PATCH") { db.setSettings({ ...db.settings(), ...(await readBody(req)) }); broadcast(); return json(res, 200, db.settings()); }
  if (head === "meals" && m === "PUT" && id) { const b = await readBody(req); db.setMeal({ day: id, breakfast: b.breakfast ?? "", lunch: b.lunch ?? "", dinner: b.dinner ?? "" }); broadcast(); return json(res, 200, { ok: true }); }
  if (COLLECTIONS.has(head)) {
    if (m === "GET") return json(res, 200, db.list(head));
    if (m === "POST") { const b = clean(await readBody(req)); const item = { ...b, id: b.id || `${head}-${Date.now()}` }; db.put(head, item); broadcast(); return json(res, 201, item); }
    if (m === "PATCH" && id) { const cur = db.get(head, id); if (!cur) return json(res, 404, { error: "Not found" }); const next = { ...cur, ...clean(await readBody(req)), id }; db.put(head, next); broadcast(); return json(res, 200, next); }
    if (m === "DELETE" && id) { db.remove(head, id); broadcast(); return json(res, 204); }
  }
  return json(res, 404, { error: "Not found" });
}

// ---------- admin panel ----------
async function admin(req, res, action, sub) {
  const m = req.method;
  if (action === "login" && m === "POST") {
    const { password } = await readBody(req);
    const c = conf();
    const ok = c.adminHash ? checkPw(password ?? "", c.adminHash) : !c.pin || String(password) === c.pin;
    if (!ok) { await new Promise((r) => setTimeout(r, 800)); return json(res, 401, { error: c.adminHash ? "Wrong admin password" : "Wrong PIN" }); }
    res.setHeader("set-cookie", `ff_admin=${token("admin")}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`);
    return json(res, 200, { ok: true });
  }
  if (!adminAuthed(req)) return json(res, 401, { error: "Admin sign-in required" });
  const c = conf();
  if (action === "me") return json(res, 200, { ok: true });
  if (action === "config" && m === "GET") return json(res, 200, publicConfig());
  if (action === "config" && m === "PATCH") {
    const patch = await readBody(req);
    const next = { ...db.config() };
    const allowed = ["immichUrl", "immichEmail", "immichAlbums", "immichPeople", "googleAlbum", "localFolder", "place", "lat", "lon", "calendars", "customFestivals", "wasteSource", "wasteArgs", ...SECRETS];
    for (const k of allowed) {
      if (!(k in patch)) continue;
      const v = patch[k];
      if (SECRETS.includes(k) && typeof v !== "string") continue; // { set } echoes are ignored
      if (k === "adminPassword") { if (v) next.adminHash = hashPw(v); continue; }
      if (k === "familyPin") { if (v && !/^\d{4,8}$/.test(v)) return json(res, 400, { error: "PIN must be 4–8 digits" }); next.familyPin = v; continue; }
      if (k === "immichUrl") { next.immichUrl = String(v).trim().replace(/\/$/, ""); continue; }
      next[k] = v;
    }
    db.setConfig(next); resetImmichSession(); clearPhotoCache(); broadcast();
    if ("wasteSource" in patch || "wasteArgs" in patch) void syncWaste(conf(), db, broadcast);
    return json(res, 200, publicConfig());
  }
  if (action === "test" && sub === "immich") {
    try {
      const r = await immichFetch(c, "/api/server/statistics");
      if (r.ok) { const j = await r.json(); return json(res, 200, { ok: true, photos: j.photos ?? 0 }); }
      const r2 = await immichFetch(c, "/api/search/random", { method: "POST", body: JSON.stringify({ size: 1 }) });
      if (!r2.ok) return json(res, 400, { error: `Immich answered ${r2.status}` });
      return json(res, 200, { ok: true, photos: null });
    } catch (err) { return json(res, 400, { error: err.message.includes("fetch failed") ? "Can't reach Immich at that address" : err.message }); }
  }
  if (action === "immich" && (sub === "albums" || sub === "people")) {
    try {
      const r = await immichFetch(c, sub === "albums" ? "/api/albums" : "/api/people?withHidden=false");
      if (!r.ok) return json(res, 400, { error: `Immich ${r.status}` });
      const j = await r.json();
      const list = sub === "albums" ? j.map((a) => ({ id: a.id, name: a.albumName })) : (j.people ?? j).filter((p) => p.name).map((p) => ({ id: p.id, name: p.name }));
      return json(res, 200, list);
    } catch (err) { return json(res, 400, { error: err.message }); }
  }
  if (action === "waste" && sub === "sources") {
    try { return json(res, 200, await wasteSources()); } catch (err) { return json(res, 400, { error: err.message }); }
  }
  if (action === "waste" && sub === "test" && m === "POST") {
    const b = await readBody(req);
    try { const rows = await fetchCollections(b.source, b.args || {}); return json(res, 200, { rows: rows.slice(0, 12), bins: binsFromCollections(rows) }); }
    catch (err) { return json(res, 400, { error: err.message }); }
  }
  if (action === "waste" && sub === "sync" && m === "POST") { await syncWaste(c, db, broadcast); return json(res, wasteStatus.ok ? 200 : 400, wasteStatus.ok ? wasteStatus : { error: wasteStatus.detail }); }
  if (action === "status") {
    const out = [];
    const ph = await listPhotos(db.settings().source, c, false).catch(() => []);
    out.push({ name: db.settings().source === "immich" ? "Immich photos" : "Google / folder photos", ok: ph.length > 0, detail: ph.length ? `${ph.length} photos ready` : "No photos found yet", at: new Date().toISOString() });
    out.push({ name: "Weather", ok: weatherStatus.ok, detail: weatherStatus.detail || "Not checked yet", at: weatherStatus.at || undefined });
    for (const e of toList(c.icalUrls)) { const person = e.includes("|") ? e.split("|")[0].trim() : "Family"; const err = lastCalendarErrors.get(person); out.push({ name: `Calendar · ${person}`, ok: !err, detail: err || "Syncing" }); }
    if (c.wasteSource) out.push({ name: "Council bin dates", ok: wasteStatus.ok, detail: wasteStatus.detail || "Not fetched yet", at: wasteStatus.at || undefined });
    return json(res, 200, out);
  }
  if (action === "reload" && m === "POST") { broadcast("reload"); return json(res, 200, { ok: true }); }
  if (action === "signout-all" && m === "POST") {
    db.setConfig({ ...db.config(), sessionGen: (c.sessionGen || 0) + 1 });
    res.setHeader("set-cookie", `ff_admin=${token("admin")}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000`);
    return json(res, 200, { ok: true });
  }
  if (action === "backup" && m === "GET") {
    res.writeHead(200, { "content-type": "application/json", "content-disposition": `attachment; filename="family-frame-backup-${new Date().toISOString().slice(0, 10)}.json"` });
    return res.end(JSON.stringify({ familyFrameBackup: 1, ...db.dump() }));
  }
  if (action === "restore" && m === "POST") {
    const b = await readBody(req);
    if (b.familyFrameBackup !== 1) return json(res, 400, { error: "That isn't a Family Frame backup" });
    db.restore(b); broadcast();
    return json(res, 200, { ok: true });
  }
  return json(res, 404, { error: "Not found" });
}

createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://local");
  if (!url.pathname.startsWith("/api/")) return proxy(req, res);
  try { await api(req, res, url); } catch (err) { console.error(err); json(res, 500, { error: "Server error" }); }
}).listen(base.port, () => console.log(`Family Frame server on :${base.port}`));

// Council bin dates: on start, then twice a day.
setTimeout(() => void syncWaste(conf(), db, broadcast), 5_000);
setInterval(() => void syncWaste(conf(), db, broadcast), 12 * 3_600_000);

// Refresh the frame every 10 minutes so weather/calendar stay fresh.
setInterval(broadcast, 10 * 60_000);
