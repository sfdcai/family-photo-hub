import type { Photo } from "@/components/photo-slide";

import art from "../../selfhost/server/art.json";

/** Preview-only fallback (no home server): the same curated paintings, loaded straight from Wikimedia Commons. */
export const sampleWallpapers: Photo[] = (art as [string, string, string, number, number][]).map(([file, title, credit, width, height]) => ({
  src: `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=1920`,
  alt: `${title} by ${credit}`, caption: title, place: "", width, height, credit, wallpaper: "art",
}));

/** Slips one wallpaper in after every `every` family photos; 0 leaves the family photos untouched. */
export function blendWallpapers<T>(photos: T[], walls: T[], every: number): T[] {
  if (!every || every < 1 || walls.length === 0) return photos;
  const out: T[] = [];
  let w = 0;
  photos.forEach((p, i) => {
    out.push(p);
    if ((i + 1) % every === 0) out.push(walls[w++ % walls.length]!);
  });
  return out;
}
