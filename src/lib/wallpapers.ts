import type { Photo } from "@/components/photo-slide";

/** Preview-only fallback (no home server): public-domain paintings straight from the Art Institute of Chicago. */
export const sampleWallpapers: Photo[] = [];

export async function previewArt(): Promise<Photo[]> {
  const r = await fetch("https://api.artic.edu/api/v1/artworks/search?q=landscape&query[term][is_public_domain]=true&limit=20&fields=id,title,artist_title,date_display,image_id,thumbnail");
  const { data = [] } = await r.json();
  return data
    .filter((a: { image_id?: string; thumbnail?: { width?: number } }) => a.image_id && a.thumbnail?.width)
    .map((a: { image_id: string; title: string; artist_title?: string; date_display?: string; thumbnail: { width: number; height: number; alt_text?: string } }) => ({
      src: `https://www.artic.edu/iiif/2/${a.image_id}/full/1686,/0/default.jpg`,
      alt: a.thumbnail.alt_text || a.title, caption: a.title, place: "",
      width: a.thumbnail.width, height: a.thumbnail.height,
      credit: [a.artist_title, a.date_display].filter(Boolean).join(", "), wallpaper: "art" as const,
    }));
}

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
