export type FitMode = "smart" | "cover" | "contain";
export type Photo = {
  src: string;
  alt: string;
  caption: string;
  place: string;
  width: number;
  height: number;
  /** People recognised in the photo (from Immich face recognition). */
  people?: string[];
  takenAt?: string;
};

const SCREEN = 16 / 9;

/** True when the photo is too small to fill a 1920×1080 screen without looking soft. */
export const isSmallPhoto = (p: Pick<Photo, "width" | "height">) => p.width < 1280 && p.height < 900;

/**
 * Photos close to 16:9 fill the screen. Others sit sharp on a blurred copy of
 * themselves; small photos keep their natural size with feathered edges.
 */
export function PhotoSlide({ photos, fit, active, eager, lite }: { photos: Photo[]; fit: FitMode; active: boolean; eager: boolean; lite?: boolean }) {
  const pair = photos.length === 2;
  const first = photos[0]!;
  const ratio = first.width / first.height;
  const nearScreen = Math.abs(ratio - SCREEN) < 0.2;
  const small = !pair && fit === "smart" && isSmallPhoto(first);
  const useCover = fit === "cover" || (fit === "smart" && nearScreen && !pair && !small);

  return (
    <div className={`photo-slide ${active ? "photo-slide-active" : ""}`} aria-hidden={!active}>
      {!useCover && fit !== "contain" && <img src={first.src} alt="" className={`photo-blur ${lite ? "photo-blur-lite" : ""}`} />}
      <div className={pair ? "photo-pair" : small ? "photo-single photo-small-wrap" : "photo-single"}>
        {photos.map((p) => (
          <img
            key={p.src}
            src={p.src}
            alt={p.alt}
            width={p.width}
            height={p.height}
            loading={eager ? "eager" : "lazy"}
            className={`photo-image ${useCover ? "photo-cover" : small ? "photo-small" : "photo-contain"}`}
            style={small ? { maxWidth: Math.round(p.width * 1.35), maxHeight: Math.round(p.height * 1.35) } : undefined}
          />
        ))}
      </div>
    </div>
  );
}

const isPortrait = (p: Photo) => p.height > p.width;

/**
 * Builds slides: portraits are paired side by side, preferring two portraits
 * of the same person, then the nearest portrait in the list.
 */
export function buildSlides(photos: Photo[]): Photo[][] {
  const slides: Photo[][] = [];
  const used = new Set<number>();
  photos.forEach((p, i) => {
    if (used.has(i)) return;
    used.add(i);
    if (!isPortrait(p)) { slides.push([p]); return; }
    const candidates = photos.map((q, j) => ({ q, j })).filter(({ q, j }) => !used.has(j) && isPortrait(q));
    const samePerson = candidates.find(({ q }) => q.people?.some((n) => p.people?.includes(n)));
    const partner = samePerson ?? candidates[0];
    if (partner) { used.add(partner.j); slides.push([p, partner.q]); } else slides.push([p]);
  });
  return slides;
}
