import { Cake, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";

import type { Settings } from "@/lib/family-store";

const pieces = Array.from({ length: 40 }, (_, i) => i);
const colors = ["bg-festival-coral", "bg-family-yellow", "bg-family-mint", "bg-festival-saffron"];
const rockets = Array.from({ length: 6 }, (_, i) => i);
const sparks = Array.from({ length: 12 }, (_, i) => i);
const lanterns = Array.from({ length: 9 }, (_, i) => i);
const streamers = Array.from({ length: 10 }, (_, i) => i);

type Style = Settings["celebrationStyle"];

/** Full-screen party layer: confetti + balloons, fireworks, streamers or floating diyas. */
export function CelebrationBurst({ style }: { style: Style }) {
  const show = (s: Exclude<Style, "mix">) => style === "mix" || style === s;
  return (
    <div className="birthday-burst" aria-hidden="true">
      {show("confetti") && pieces.map((i) => (
        <span key={`c${i}`} className={`confetti ${colors[i % 4]}`} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.18}s` }} />
      ))}
      {show("confetti") && colors.map((c, i) => (
        <span key={c} className={`balloon ${c}`} style={{ left: `${18 + i * 20}%`, animationDelay: `${i * 0.4}s` }} />
      ))}
      {show("confetti") && streamers.map((i) => (
        <span key={`s${i}`} className={`streamer ${colors[i % 4]}`} style={{ left: `${5 + i * 10}%`, animationDelay: `${(i % 5) * 0.3}s` }} />
      ))}
      {show("fireworks") && rockets.map((r) => (
        <span key={`f${r}`} className="firework" style={{ left: `${12 + r * 15}%`, top: `${18 + ((r * 23) % 30)}%`, animationDelay: `${r * 0.7}s` }}>
          {sparks.map((s) => <i key={s} className={colors[(s + r) % 4]} style={{ transform: `rotate(${s * 30}deg)` }} />)}
        </span>
      ))}
      {show("lanterns") && lanterns.map((i) => (
        <span key={`l${i}`} className="lantern" style={{ left: `${6 + i * 11}%`, animationDelay: `${(i % 4) * 0.9}s`, animationDuration: `${8 + (i % 3) * 2}s` }}>🪔</span>
      ))}
    </div>
  );
}

export function BirthdayCelebration({ name, age, style = "mix", label }: { name: string; age?: number; style?: Style; label?: string }) {
  const [burst, setBurst] = useState(true);

  useEffect(() => {
    const off = window.setTimeout(() => setBurst(false), 8_000);
    const again = window.setInterval(() => {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 8_000);
    }, 15 * 60_000);
    return () => { window.clearTimeout(off); window.clearInterval(again); };
  }, []);

  const text = label ?? `Happy ${age}th birthday, ${name}!`;
  return (
    <>
      {burst && <CelebrationBurst style={style} />}
      <button
        className={`birthday-banner ${burst ? "birthday-banner-big" : ""}`}
        onClick={() => { setBurst(false); window.setTimeout(() => setBurst(true), 30); }}
        aria-label={`Celebrate ${name}`}
      >
        {burst ? <PartyPopper size={26} /> : <Cake size={18} />}
        <span>{text}</span>
      </button>
    </>
  );
}
