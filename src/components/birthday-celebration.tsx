import { Cake, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";

const pieces = Array.from({ length: 40 }, (_, i) => i);
const balloons = ["bg-festival-coral", "bg-family-yellow", "bg-family-mint", "bg-festival-saffron"];

export function BirthdayCelebration({ name, age }: { name: string; age: number }) {
  const [burst, setBurst] = useState(true);

  useEffect(() => {
    const off = window.setTimeout(() => setBurst(false), 7_000);
    const again = window.setInterval(() => {
      setBurst(true);
      window.setTimeout(() => setBurst(false), 7_000);
    }, 15 * 60_000);
    return () => { window.clearTimeout(off); window.clearInterval(again); };
  }, []);

  return (
    <>
      {burst && (
        <div className="birthday-burst" aria-hidden="true">
          {pieces.map((i) => (
            <span key={i} className={`confetti ${balloons[i % 4]}`} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 10) * 0.18}s` }} />
          ))}
          {balloons.map((c, i) => (
            <span key={c} className={`balloon ${c}`} style={{ left: `${18 + i * 20}%`, animationDelay: `${i * 0.4}s` }} />
          ))}
        </div>
      )}
      <button
        className={`birthday-banner ${burst ? "birthday-banner-big" : ""}`}
        onClick={() => setBurst(true)}
        aria-label={`Celebrate ${name}'s birthday`}
      >
        {burst ? <PartyPopper size={26} /> : <Cake size={18} />}
        <span>Happy {age}th birthday, {name}!</span>
      </button>
    </>
  );
}
