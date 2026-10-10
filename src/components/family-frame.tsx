import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Cog,
  Image as ImageIcon,
  ListTodo,
  Moon,
  Pause,
  Play,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import familyBaking from "@/assets/family-baking.jpg";
import familyBirthday from "@/assets/family-birthday-portrait.jpg";
import familyKite from "@/assets/family-kite.jpg";
import familyLake from "@/assets/family-lake.jpg";
import familyMayaSwing from "@/assets/family-maya-swing.jpg";
import familyPicnic from "@/assets/family-picnic.jpg";
import { FamilyStoreProvider, useFamily } from "@/lib/family-store";

import { BirthdayCelebration } from "./birthday-celebration";
import { personColor } from "./family-data";
import { PhotoSlide, buildSlides, type Photo } from "./photo-slide";
import { PhotoWall } from "./photo-wall";
import { WeatherIcon, weatherKindFromCode, weatherLabel } from "./weather-icon";
import { WeekPlanner } from "./week-planner";

const samplePhotos: Photo[] = [
  { src: familyPicnic, alt: "A family laughing together at a garden picnic", caption: "Strawberry negotiations", place: "Home", width: 1536, height: 1024, takenAt: "2025-07-12T13:00:00Z" },
  { src: familyBirthday, alt: "A girl blowing out birthday candles", caption: "Nine wishes, one breath", place: "Home", width: 768, height: 1024, people: ["Maya"], takenAt: "2025-10-04T17:30:00Z" },
  { src: familyBaking, alt: "A family baking festive sweets together", caption: "The great ladoo experiment", place: "Kitchen", width: 1536, height: 1024, takenAt: "2025-11-01T10:00:00Z" },
  { src: familyKite, alt: "A family flying a kite on a hill", caption: "The kite won, eventually", place: "Hampstead Heath", width: 1024, height: 768, takenAt: "2025-09-21T15:00:00Z" },
  { src: familyMayaSwing, alt: "A girl laughing on a garden swing", caption: "Higher! Higher!", place: "Garden", width: 768, height: 1024, people: ["Maya"], takenAt: "2025-08-16T12:00:00Z" },
  { src: familyLake, alt: "A family walking beside a lake in autumn", caption: "Last one to the lake!", place: "Lake District", width: 1536, height: 1024, takenAt: "2025-10-19T11:00:00Z" },
];

const accents = ["bg-festival-saffron", "bg-festival-mint", "bg-festival-coral", "bg-festival-yellow"];

type Mode = "photos" | "overview";

export function FamilyFrame() {
  return (
    <FamilyStoreProvider>
      <FrameScreen />
    </FamilyStoreProvider>
  );
}

const toMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };

function isNight(now: Date, start: string, end: string) {
  const m = now.getHours() * 60 + now.getMinutes();
  const s = toMinutes(start), e = toMinutes(end);
  return s > e ? m >= s || m < e : m >= s && m < e;
}

function FrameScreen() {
  const { state, live, setSettings } = useFamily();
  const { settings, weather } = state;
  const [photos, setPhotos] = useState<Photo[]>(samplePhotos);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("photos");
  const [now, setNow] = useState(() => new Date());
  const [wokenAt, setWokenAt] = useState(0);
  const touchStart = useRef<number | null>(null);
  const slides = useMemo(() => buildSlides(photos), [photos]);

  useEffect(() => {
    if (!live) return;
    fetch("/api/photos").then((r) => r.json()).then((list: Photo[]) => { if (list.length) setPhotos(list); }).catch(() => undefined);
  }, [live]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!playing || mode === "overview") return;
    const slideshow = window.setInterval(() => setPhotoIndex((c) => (c + 1) % slides.length), settings.intervalSec * 1000);
    return () => window.clearInterval(slideshow);
  }, [playing, mode, slides.length, settings.intervalSec]);

  // Prefetch the next slide so transitions never stutter.
  useEffect(() => {
    const next = slides[(photoIndex + 1) % slides.length];
    next?.forEach((p) => { const img = new Image(); img.src = p.src; });
  }, [photoIndex, slides]);

  // Return to photos after 2 minutes without a touch in overview.
  useEffect(() => {
    if (mode !== "overview") return;
    let timer = window.setTimeout(() => setMode("photos"), 120_000);
    const reset = () => { window.clearTimeout(timer); timer = window.setTimeout(() => setMode("photos"), 120_000); };
    window.addEventListener("pointerdown", reset);
    return () => { window.clearTimeout(timer); window.removeEventListener("pointerdown", reset); };
  }, [mode]);

  const formatted = useMemo(() => ({
    time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now),
    date: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now),
  }), [now]);

  const todayIndex = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const night = isNight(now, settings.nightStart, settings.nightEnd) && now.getTime() - wokenAt > 5 * 60_000;
  const agenda = state.events.filter((e) => e.day === todayIndex).sort((a, b) => toMinutes(a.time) - toMinutes(b.time)).slice(0, 4);
  const due = state.chores.filter((c) => !c.done);
  const todayBirthday = state.birthdays.find((b) => b.daysAway === 0);
  const nextBirthday = state.birthdays.filter((b) => b.daysAway > 0 && b.daysAway <= 7).sort((a, b) => a.daysAway - b.daysAway)[0];
  const kind = weatherKindFromCode(weather.code);
  const movePhoto = (d: number) => setPhotoIndex((c) => (c + d + slides.length) % slides.length);
  const currentPhoto = slides[photoIndex]?.[0];

  if (night) {
    return (
      <main className="frame-shell night-screen" onPointerDown={() => setWokenAt(Date.now())}>
        <Moon size={36} />
        <div className="clock-time">{formatted.time}</div>
        <div className="clock-date">{formatted.date} · Sleep well</div>
        <small>Tap to wake</small>
      </main>
    );
  }

  return (
    <main
      className={`frame-shell ${mode === "overview" ? "frame-overview" : ""} ${settings.lite ? "frame-lite" : ""}`}
      onTouchStart={(e) => { touchStart.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        if (touchStart.current === null || mode === "overview") return;
        const end = e.changedTouches[0]?.clientX ?? touchStart.current;
        if (Math.abs(end - touchStart.current) > 60) movePhoto(end > touchStart.current ? -1 : 1);
        touchStart.current = null;
      }}
    >
      <section className="photo-stage" aria-label="Family photo slideshow">
        {settings.displayStyle === "wall" && !settings.lite ? (
          <PhotoWall photos={photos} intervalSec={settings.intervalSec} />
        ) : (
          slides.map((slide, index) => (
            <PhotoSlide key={slide.map((p) => p.src).join("|")} photos={slide} fit={settings.fit} active={index === photoIndex} eager={index === 0} lite={settings.lite} transition={settings.transition} />
          ))
        )}
        <div className="photo-vignette" />
      </section>

      {todayBirthday && mode === "photos" && <BirthdayCelebration name={todayBirthday.name} age={todayBirthday.age} />}
      {mode === "overview" && <WeekPlanner todayIndex={todayIndex} nowMinutes={nowMinutes} />}

      <header className="top-rail">
        <div className="clock-block">
          <div className="clock-time">{formatted.time}</div>
          <div className="clock-date">{formatted.date}</div>
        </div>
        <div className="mode-switch" aria-label="Display mode">
          <button className={mode === "photos" ? "mode-active" : ""} onClick={() => setMode("photos")} aria-label="Photo first view"><ImageIcon size={18} /> Photos</button>
          <button className={mode === "overview" ? "mode-active" : ""} onClick={() => setMode("overview")} aria-label="Family overview"><CalendarDays size={18} /> Overview</button>
        </div>
        <div className="weather-now">
          <WeatherIcon kind={kind} size={64} />
          <div>
            <div className="weather-temp">{weather.temp}°</div>
            <div className="weather-place">{weatherLabel[kind]} · {weather.place}</div>
          </div>
        </div>
      </header>

      <aside className="left-rail">
        <div className="rail-title"><CalendarDays size={17} /> Today</div>
        <div className="agenda-list">
          {agenda.length === 0 && <p className="rail-empty">Nothing planned — adventure time!</p>}
          {agenda.map((item) => (
            <article className="agenda-item" key={item.id}>
              <span className={`agenda-dot ${personColor[item.person]}`} />
              <div><time>{item.time}</time><h2>{item.title}</h2><p>{item.person}</p></div>
            </article>
          ))}
        </div>
        <div className="due-card">
          <div className="due-icon"><ListTodo size={18} /></div>
          <div><strong>{due.length} chores to do</strong><span>{due.slice(0, 2).map((c) => c.title).join(" · ") || "All done!"}</span></div>
        </div>
      </aside>

      <aside className="right-rail">
        <div className="rail-title"><CloudSun size={18} /> Forecast</div>
        <div className="forecast-list">
          {weather.daily.map((d) => (
            <div className="forecast-row" key={d.day}>
              <span>{d.day}</span><WeatherIcon kind={weatherKindFromCode(d.code)} size={30} /><strong>{d.high}°</strong><small>{d.low}°</small>
            </div>
          ))}
        </div>
        <div className="next-up">
          <span>COMING UP</span>
          {nextBirthday ? (<><strong>{nextBirthday.name}'s birthday</strong><p>in {nextBirthday.daysAway} days · turning {nextBirthday.age}</p></>) : (<><strong>Family film night</strong><p>Friday · 19:00</p></>)}
        </div>
      </aside>

      <div className="photo-caption" key={photoIndex}>
        <Sparkles size={17} />
        <div>
          <strong>{currentPhoto?.caption}</strong>
          <span>{[currentPhoto?.place, currentPhoto?.takenAt && new Date(currentPhoto.takenAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })].filter(Boolean).join(" · ")}</span>
        </div>
      </div>

      <div className="photo-controls">
        <button onClick={() => movePhoto(-1)} aria-label="Previous photo"><ChevronLeft /></button>
        <button className="play-control" onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
          {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </button>
        <button onClick={() => movePhoto(1)} aria-label="Next photo"><ChevronRight /></button>
        <div className="slide-dots" aria-label={`Photo ${photoIndex + 1} of ${slides.length}`}>
          {slides.map((slide, index) => <span key={slide.map((p) => p.src).join("|")} className={index === photoIndex ? "dot-active" : ""} />)}
        </div>
      </div>

      <footer className="bottom-rail">
        <div className="festival-heading"><Sparkles size={18} /><span>On the family horizon</span></div>
        <div className="festival-list">
          {todayBirthday && (
            <article className="festival-item"><span className="festival-line bg-festival-coral" /><div><time>TODAY</time><strong>{todayBirthday.name} turns {todayBirthday.age}</strong><small>Family birthday</small></div></article>
          )}
          {state.festivals.slice(0, todayBirthday ? 4 : 5).map((f, i) => (
            <article className="festival-item" key={f.name}>
              <span className={`festival-line ${accents[i % 4]}`} />
              <div><time>{f.date}</time><strong>{f.name}</strong><small>{f.kind}</small></div>
            </article>
          ))}
        </div>
        <button className="settings-button" onClick={() => setSettingsOpen(true)} aria-label="Open display settings"><Cog size={22} /></button>
      </footer>

      {settingsOpen && (
        <div className="settings-backdrop" role="presentation" onMouseDown={(e) => { if (e.currentTarget === e.target) setSettingsOpen(false); }}>
          <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <header><div><span>FAMILY FRAME</span><h2 id="settings-title">Display settings</h2></div><button onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X /></button></header>
            <div className="settings-content">
              <section><h3>Photo source</h3><div className="source-options">
                {([["immich", "Immich", "Self-hosted · faces for portrait pairs"], ["google", "Google Photos", "Picked family album"]] as const).map(([id, label, hint]) => (
                  <button key={id} className={settings.source === id ? "source-active" : ""} onClick={() => setSettings({ source: id })}><ImageIcon /><span><strong>{label}</strong><small>{hint}</small></span>{settings.source === id && <Check />}</button>
                ))}
              </div></section>
              <section><h3>Slideshow</h3><div className="setting-row"><span>Change photo every</span><strong>{settings.intervalSec} seconds</strong></div>
                <input aria-label="Slideshow timing" type="range" min="5" max="60" value={settings.intervalSec} onChange={(e) => setSettings({ intervalSec: Number(e.target.value) })} /></section>
              <section><h3>Display style</h3><div className="fit-options">
                {([["slideshow", "Slideshow", "One photo at a time, full screen"], ["wall", "Photo wall", "Six photos in a calm grid, one changes at a time"]] as const).map(([id, label, hint]) => (
                  <button key={id} className={settings.displayStyle === id ? "source-active" : ""} onClick={() => setSettings({ displayStyle: id })}><span><strong>{label}</strong><small>{hint}</small></span>{settings.displayStyle === id && <Check />}</button>
                ))}
              </div>{settings.lite && <p className="settings-note">Photo wall is paused while Lite effects is on.</p>}</section>
              <section><h3>Photo transition</h3><div className="fit-options">
                {([["fade", "Fade", "Gentle cross-fade"], ["slide", "Slide", "Photos glide sideways"], ["zoom", "Zoom", "Slow cinematic drift"], ["flip", "Flip", "Playful card turn"]] as const).map(([id, label, hint]) => (
                  <button key={id} className={settings.transition === id ? "source-active" : ""} onClick={() => setSettings({ transition: id })}><span><strong>{label}</strong><small>{hint}</small></span>{settings.transition === id && <Check />}</button>
                ))}
              </div></section>
              <section><h3>Photo fit</h3><div className="fit-options">
                {([["smart", "Smart fill", "Blurred backdrop, soft edges for small photos"], ["cover", "Fill screen", "Crops edges, no gaps"], ["contain", "Fit", "Whole photo, dark bars"]] as const).map(([id, label, hint]) => (
                  <button key={id} className={settings.fit === id ? "source-active" : ""} onClick={() => setSettings({ fit: id })}><span><strong>{label}</strong><small>{hint}</small></span>{settings.fit === id && <Check />}</button>
                ))}
              </div><p className="settings-note">Portraits are paired side by side, two of the same person when Immich recognises them.</p></section>
              <section><h3>Frame</h3>
                <button className={`tick-row ${settings.lite ? "" : ""}`} onClick={() => setSettings({ lite: !settings.lite })}><span className="tick-box">{settings.lite && <Check size={16} />}</span>Lite effects (faster on older frames)</button>
                <div className="setting-row"><span>Night mode</span><strong>{settings.nightStart} – {settings.nightEnd}</strong></div>
              </section>
              <section><h3>Integrations</h3><div className="module-grid">
                <Module name="Immich" use={live ? "Configured on server" : "Set IMMICH_URL + key"} />
                <Module name="Google Photos" use="Picker album via server" />
                <Module name="iCloud Calendar" use="Shared calendar link (ICAL_URLS)" />
                <Module name="Weather" use="Open-Meteo · no key needed" />
                <Module name="Festivals" use="UK bank holidays + India + Hindu" />
                <Module name="Phone app" use="Open /app on iPhone → Add to Home Screen" />
              </div></section>
            </div>
            <footer><Settings2 size={17} /><span>{live ? "Connected to your Family Frame server" : "Preview · sample data, not connected to your server"}</span></footer>
          </section>
        </div>
      )}
    </main>
  );
}

function Module({ name, use }: { name: string; use: string }) {
  return <div className="module-item"><strong>{name}</strong><span>{use}</span></div>;
}
