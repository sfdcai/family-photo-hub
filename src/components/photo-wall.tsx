import { useEffect, useMemo, useState } from "react";

import type { Photo } from "./photo-slide";

const TILES = 6;

/**
 * Photo Wall: a calm 3×2 grid of family photos. Every few seconds one tile
 * gently cross-fades to the next photo in the list, so the wall feels alive
 * without ever demanding attention.
 */
export function PhotoWall({ photos, intervalSec }: { photos: Photo[]; intervalSec: number }) {
  const pool = useMemo(() => (photos.length ? photos : []), [photos]);
  const [tiles, setTiles] = useState<(Photo | undefined)[]>(() => pool.slice(0, TILES));
  const [cursor, setCursor] = useState(TILES);

  useEffect(() => {
    setTiles(pool.slice(0, TILES));
    setCursor(TILES);
  }, [pool]);

  useEffect(() => {
    if (pool.length <= TILES) return;
    const timer = window.setInterval(() => {
      setTiles((current) => {
        const slot = Math.floor(Math.random() * TILES);
        const next = [...current];
        next[slot] = pool[cursor % pool.length];
        return next;
      });
      setCursor((c) => c + 1);
    }, Math.max(4, intervalSec) * 1000);
    return () => window.clearInterval(timer);
  }, [pool, cursor, intervalSec]);

  return (
    <div className="photo-wall" aria-label="Family photo wall">
      {Array.from({ length: TILES }, (_, i) => {
        const photo = tiles[i];
        return (
          <figure key={i} className={`wall-tile wall-tile-${i}`}>
            {photo && <img key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} loading="lazy" />}
          </figure>
        );
      })}
    </div>
  );
}
