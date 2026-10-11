import { Backpack, Check, Shirt, Sunrise, UtensilsCrossed } from "lucide-react";

import { useFamily } from "@/lib/family-store";
import { binsOn, clubsForDay, dressAdvice, localDateKey } from "@/lib/routine";

import { WeatherIcon, weatherKindFromCode, weatherLabel } from "./weather-icon";


/** The school-morning screen: dress for the weather, clubs + kit, and a tap-to-tick checklist. */
export function MorningLaunchpad({ now, todayIndex, deg, onPhotos }: { now: Date; todayIndex: number; deg: (c: number) => number; onPhotos: () => void }) {
  const { state, setSettings } = useFamily();
  const { settings, weather } = state;
  const today = weather.daily[0];
  const advice = dressAdvice(weather.temp, today?.high ?? weather.temp, weather.code);
  const clubs = clubsForDay(settings.clubs, todayIndex);
  const key = localDateKey(now);
  const done = settings.morningDone.date === key ? settings.morningDone.ids : [];
  const people = Array.from(new Set(settings.morningTasks.map((t) => t.person)));
  const dayName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][todayIndex];
  const dinner = state.meals.find((m) => dayName?.startsWith(m.day) || m.day === dayName)?.dinner;
  const toggle = (id: string) => setSettings({ morningDone: { date: key, ids: done.includes(id) ? done.filter((x) => x !== id) : [...done, id] } });
  const binsToday = binsOn(settings.bins, now);
  const total = settings.morningTasks.length;
  const allDone = total > 0 && done.length >= total;

  return (
    <section className="morning" aria-label="Morning launchpad">
      <header className="morning-head">
        <div><small><Sunrise size={16} /> GOOD MORNING</small><h2>{allDone ? "Everyone's ready — have a brilliant day!" : `${done.length} of ${total} jobs done`}</h2></div>
        <button className="phone-secondary morning-photos" onClick={onPhotos}>Show photos</button>
      </header>

      <div className="morning-grid">
        <article className="morning-card morning-dress">
          <small><Shirt size={15} /> Dress for today</small>
          <div className="morning-wx">
            <WeatherIcon kind={weatherKindFromCode(weather.code)} size={78} />
            <div><strong>{deg(weather.temp)}°</strong><span>{weatherLabel[weatherKindFromCode(weather.code)]}{today ? ` · up to ${deg(today.high)}°` : ""}</span></div>
          </div>
          <h3>{advice.title}</h3>
          <ul>{advice.items.map((i) => <li key={i}>{i}</li>)}</ul>
        </article>

        <article className="morning-card morning-checklist">
          <small><Check size={15} /> Before we leave</small>
          <div className="morning-people">
            {people.map((p) => (
              <div key={p} className="morning-person">
                <strong><MemberDot name={p} /> {p}</strong>
                {settings.morningTasks.filter((t) => t.person === p).map((t) => {
                  const on = done.includes(t.id);
                  return (
                    <button key={t.id} className={`morning-task ${on ? "is-done" : ""}`} onClick={() => toggle(t.id)} aria-pressed={on}>
                      <span className="morning-emoji">{on ? "✅" : t.emoji}</span>{t.title}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </article>

        <article className="morning-card morning-clubs">
          <small><Backpack size={15} /> School & clubs today</small>
          {clubs.length === 0 && <p className="rail-empty">No clubs today — straight home after school.</p>}
          {clubs.map((c) => (
            <div key={c.id} className="morning-club">
              <MemberDot name={c.person} />
              <div>
                <time>{c.when === "before" ? "Before school" : "After school"} · {c.start}–{c.end}</time>
                <strong>{c.person} · {c.title}</strong>
                {c.kit && <p>🎒 Pack: {c.kit}</p>}
                {c.pickup && <p>🚗 {c.pickup} picks up at {c.end}</p>}
              </div>
            </div>
          ))}
          {binsToday.length > 0 && <div className="morning-dinner">🗑️ Bin day: <strong>{binsToday.map((b) => `${b.emoji} ${b.name}`).join(", ")}</strong></div>}
          {dinner && <div className="morning-dinner"><UtensilsCrossed size={15} /> Tonight: <strong>{dinner}</strong></div>}
        </article>
      </div>
    </section>
  );
}
