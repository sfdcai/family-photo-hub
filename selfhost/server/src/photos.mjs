import { readdir, stat, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";
import { immichFetch } from "./immich.mjs";

const IMG = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic"]);
let cache = { at: 0, key: "", list: [] };

async function immichList(cfg, memoriesOn) {
  const people = cfg.immichPeople, albums = cfg.immichAlbums;
  const body = { size: 120, type: "IMAGE", withPeople: true, withExif: true };
  if (people) body.personIds = people.split(",").map((s) => s.trim());
  if (albums) body.albumIds = albums.split(",").map((s) => s.trim());
  const res = await immichFetch(cfg, "/api/search/random", { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Immich ${res.status}`);
  const assets = await res.json();
  const memories = memoriesOn ? await onThisDay(cfg) : [];
  return [...memories, ...assets].map((a) => {
    const w = a.exifInfo?.exifImageWidth ?? 1600, h = a.exifInfo?.exifImageHeight ?? 1200;
    const rotated = [5, 6, 7, 8].includes(Number(a.exifInfo?.orientation));
    const taken = a.localDateTime ?? a.fileCreatedAt;
    return {
      src: `/api/photo/immich/${a.id}`,
      alt: a.exifInfo?.description || "Family photo",
      caption: a.memoryTitle || a.exifInfo?.description || (a.people?.map((p) => p.name).filter(Boolean).join(" & ") || "Family moments"),
      place: a.exifInfo?.city || a.exifInfo?.state || "",
      width: rotated ? h : w,
      height: rotated ? w : h,
      people: (a.people ?? []).map((p) => p.name).filter(Boolean),
      takenAt: taken,
      favorite: a.isFavorite,
      live: a.livePhotoVideoId ? `/api/photo/live/${a.livePhotoVideoId}` : undefined,
    };
  });
}

async function onThisDay(cfg) {
  try {
    const res = await immichFetch(cfg, `/api/memories?for=${new Date().toISOString()}`);
    if (!res.ok) return [];
    const memories = await res.json();
    return memories.flatMap((m) => (m.assets ?? []).slice(0, 4).map((a) => ({ ...a, memoryTitle: `On this day · ${m.data?.year ?? ""}` })));
  } catch { return []; }
}

async function folderList(dir) {
  const out = [];
  async function walk(d) {
    for (const e of await readdir(d, { withFileTypes: true }).catch(() => [])) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else if (IMG.has(extname(e.name).toLowerCase())) out.push(p);
    }
  }
  await walk(dir);
  const list = [];
  for (const p of out.slice(0, 2000)) {
    try {
      const meta = await sharp(p).metadata();
      const rotated = (meta.orientation ?? 1) >= 5;
      const st = await stat(p);
      list.push({
        src: `/api/photo/folder/${Buffer.from(p.slice(dir.length)).toString("base64url")}`,
        alt: "Family photo", caption: "Family moments",
        place: "",
        width: rotated ? meta.height : meta.width, height: rotated ? meta.width : meta.height,
        people: [], takenAt: st.mtime.toISOString(),
      });
    } catch { /* unreadable file */ }
  }
  return list;
}

function shuffleWithFavourites(list) {
  const weighted = list.flatMap((p) => (p.favorite ? [p, p] : [p]));
  for (let i = weighted.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [weighted[i], weighted[j]] = [weighted[j], weighted[i]]; }
  const seen = new Set();
  return weighted.filter((p) => (seen.has(p.src) ? false : seen.add(p.src)));
}

export const clearPhotoCache = () => { cache = { at: 0, key: "", list: [] }; };

export async function listPhotos(source, cfg, memoriesOn = true) {
  const key = `${source}|${cfg.immichUrl}|${cfg.immichAlbums}|${cfg.immichPeople}|${memoriesOn}|${cfg.localFolder}`;
  if (cache.key === key && Date.now() - cache.at < 20 * 60_000) return cache.list;
  let list = [];
  try {
    list = source === "immich" && cfg.immichUrl ? await immichList(cfg, memoriesOn)
      : await folderList(source === "google" ? cfg.googleDir : cfg.photoDir);
    if (source === "immich" && cfg.immichUrl && cfg.localFolder) list = [...list, ...(await folderList(cfg.photoDir))];
  } catch (err) { console.warn("photos failed", err.message); return cache.list; }
  cache = { at: Date.now(), key, list: shuffleWithFavourites(list).slice(0, 150) };
  return cache.list;
}

/** Live Photo / video clip from Immich's transcoded playback stream; the Range header is forwarded. */
export async function liveVideo(id, cfg, range) {
  if (!/^[\w-]+$/.test(id)) throw new Error("bad id");
  const res = await immichFetch(cfg, `/api/assets/${id}/video/playback`, { headers: { accept: "video/*", ...(range ? { range } : {}) } });
  if (!res.ok) throw new Error(`Immich ${res.status}`);
  return res;
}

/** Small in-memory cache of resized photos so repeat slides cost nothing. */
const bytesCache = new Map();
const CACHE_MAX = 60;

/** Returns a 1920×1080-bounded JPEG for the frame. Small originals are never enlarged. */
export async function photoBytes(kind, id, cfg) {
  const ck = `${kind}/${id}`;
  if (bytesCache.has(ck)) { const b = bytesCache.get(ck); bytesCache.delete(ck); bytesCache.set(ck, b); return b; }
  const out = await renderPhoto(kind, id, cfg);
  bytesCache.set(ck, out);
  if (bytesCache.size > CACHE_MAX) bytesCache.delete(bytesCache.keys().next().value);
  return out;
}

async function renderPhoto(kind, id, cfg) {
  let input;
  if (kind === "immich") {
    const res = await immichFetch(cfg, `/api/assets/${id}/thumbnail?size=preview`, { headers: { accept: "image/*" } });
    if (!res.ok) throw new Error(`Immich ${res.status}`);
    input = Buffer.from(await res.arrayBuffer());
  } else {
    const base = kind === "folder" ? cfg.photoDir : cfg.googleDir;
    const rel = Buffer.from(id, "base64url").toString();
    if (rel.includes("..")) throw new Error("bad path");
    input = await readFile(join(base, rel));
  }
  return sharp(input).rotate().resize(1920, 1080, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
}
