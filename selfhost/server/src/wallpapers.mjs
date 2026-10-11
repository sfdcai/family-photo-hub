import sharp from "sharp";
import { existsSync, readFileSync } from "node:fs";

/**
 * Wallpaper & art sources for the frame: Bing's daily 1080p wallpapers and
 * public-domain paintings from the Art Institute of Chicago. No API keys.
 */
const UA = { "user-agent": "FamilyFrame/1.0 (self-hosted photo frame)" };
let lists = { bing: { at: 0, list: [] }, art: { at: 0, list: [] } };
const LIST_TTL = 6 * 3600_000;

async function bingList() {
  const out = [];
  for (const idx of [0, 8]) {
    const r = await fetch(`https://www.bing.com/HPImageArchive.aspx?format=js&idx=${idx}&n=8&mkt=en-GB`, { headers: UA });
    if (!r.ok) continue;
    const { images = [] } = await r.json();
    for (const im of images) {
      const id = Buffer.from(`${im.urlbase}_1920x1080.jpg`).toString("base64url");
      const [title, credit] = String(im.copyright ?? "").split(/\s*\((©[^)]*)\)\s*$/);
      out.push({
        src: `/api/wallpaper/bing/${id}`, alt: im.title || title || "Bing wallpaper",
        caption: im.title || title, place: title || "", width: 1920, height: 1080,
        credit: credit || "© Bing", wallpaper: "bing",
      });
    }
  }
  const seen = new Set();
  return out.filter((p) => (seen.has(p.src) ? false : seen.add(p.src)));
}

/** Curated public-domain masterpieces served via Wikimedia Commons (shared with the UI preview). */
// In Docker the list is copied next to the server; in a repo checkout it lives in src/lib.
const artFile = [new URL("../art.json", import.meta.url), new URL("../../../src/lib/art.json", import.meta.url)].find((u) => existsSync(u));
const ART = artFile ? JSON.parse(readFileSync(artFile, "utf8")) : [];
async function artList() {
  return ART.map(([file, title, credit, width, height]) => ({
    src: `/api/wallpaper/art/${Buffer.from(file).toString("base64url")}`, alt: `${title} by ${credit}`,
    caption: title, place: "", width, height, credit, wallpaper: "art",
  }));
}

export async function listWallpapers(sources = ["bing", "art"]) {
  const all = [];
  for (const s of sources) {
    const c = lists[s];
    if (!c) continue;
    if (Date.now() - c.at > LIST_TTL || !c.list.length) {
      try { lists[s] = { at: Date.now(), list: s === "bing" ? await bingList() : await artList() }; }
      catch (err) { console.warn(`wallpapers ${s} failed`, err.message); }
    }
    all.push(...lists[s].list);
  }
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  return all;
}

const bytes = new Map();
export async function wallpaperBytes(kind, id) {
  const key = `${kind}/${id}`;
  if (bytes.has(key)) return bytes.get(key);
  let url;
  if (kind === "bing") {
    const path = Buffer.from(id, "base64url").toString();
    if (!path.startsWith("/th?id=")) throw new Error("bad id");
    url = `https://www.bing.com${path}`;
  } else if (kind === "art") {
    const file = Buffer.from(id, "base64url").toString();
    if (!ART.some(([f]) => f === file)) throw new Error("unknown painting");
    url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1920`;
  } else throw new Error("unknown source");
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${kind} ${r.status}`);
  const out = await sharp(Buffer.from(await r.arrayBuffer())).resize(1920, 1080, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
  bytes.set(key, out);
  if (bytes.size > 40) bytes.delete(bytes.keys().next().value);
  return out;
}
