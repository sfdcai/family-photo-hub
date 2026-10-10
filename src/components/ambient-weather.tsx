import { useMemo } from "react";

import { ambientKind } from "@/lib/routine";

/** Full-screen rain / snow / thunder over the photos. CSS-only, no JS animation loop. */
export function AmbientWeather({ code, opacity, forceKind }: { code: number; opacity: number; forceKind?: "rain" | "snow" | "storm" | null }) {
  const kind = forceKind ?? ambientKind(code);
  const drops = useMemo(() => Array.from({ length: kind === "snow" ? 46 : 60 }, (_, i) => ({
    left: (i * 37.3) % 100,
    delay: -((i * 0.73) % (kind === "snow" ? 9 : 1.4)),
    dur: kind === "snow" ? 7 + ((i * 1.7) % 6) : 0.75 + ((i * 0.13) % 0.6),
    size: kind === "snow" ? 3 + ((i * 7) % 6) : 1,
  })), [kind]);
  if (!kind) return null;
  const flake = kind === "snow";
  return (
    <div className={`ambient ambient-${kind}`} style={{ opacity: opacity / 100 }} aria-hidden="true">
      {drops.map((d, i) => (
        <span key={i} className={flake ? "ambient-flake" : "ambient-drop"}
          style={{ left: `${d.left}%`, animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`, ...(flake ? { width: d.size, height: d.size } : {}) }} />
      ))}
      {kind !== "snow" && <div className="ambient-glass" />}
      {kind === "storm" && <div className="ambient-flash" />}
    </div>
  );
}
