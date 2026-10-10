export type FitMode = "smart" | "cover" | "contain";
export type Photo = { src: string; alt: string; caption: string; place: string; width: number; height: number };

const SCREEN = 16 / 9;

/** Photos close to 16:9 fill the screen; others sit sharp on a blurred copy of themselves. */
export function PhotoSlide({ photos, fit, active, eager }: { photos: Photo[]; fit: FitMode; active: boolean; eager: boolean }) {
  const pair = photos.length === 2;
  const first = photos[0]!;
  const ratio = first.width / first.height;
  const nearScreen = Math.abs(ratio - SCREEN) < 0.2;
  const useCover = fit === "cover" || (fit === "smart" && nearScreen && !pair);

  return (
    <div className={`photo-slide ${active ? "photo-slide-active" : ""}`} aria-hidden={!active}>
      {!useCover && fit !== "contain" && <img src={first.src} alt="" className="photo-blur" />}
      <div className={pair ? "photo-pair" : "photo-single"}>
        {photos.map((p) => (
          <img
            key={p.src}
            src={p.src}
            alt={p.alt}
            width={p.width}
            height={p.height}
            loading={eager ? "eager" : "lazy"}
            className={`photo-image ${useCover ? "photo-cover" : "photo-contain"}`}
          />
        ))}
      </div>
    </div>
  );
}

/** Groups consecutive portrait photos into side-by-side pairs. */
export function buildSlides(photos: Photo[]): Photo[][] {
  const slides: Photo[][] = [];
  let pending: Photo | null = null;
  for (const p of photos) {
    if (p.height > p.width) {
      if (pending) { slides.push([pending, p]); pending = null; } else pending = p;
    } else slides.push([p]);
  }
  if (pending) slides.push([pending]);
  return slides;
}
