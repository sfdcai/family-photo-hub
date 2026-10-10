import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Cog,
  Image as ImageIcon,
  ListTodo,
  Pause,
  Play,
  Settings2,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import familyBaking from "@/assets/family-baking.jpg";
import familyLake from "@/assets/family-lake.jpg";
import familyPicnic from "@/assets/family-picnic.jpg";

const photos = [
  { src: familyPicnic, caption: "Strawberry negotiations", place: "Home · last summer" },
  { src: familyBaking, caption: "The great ladoo experiment", place: "Diwali morning" },
  { src: familyLake, caption: "Last one to the lake!", place: "Lake District · October" },
];

const agenda = [
  { time: "08:15", title: "School drop-off", person: "Mum", color: "bg-family-mint" },
  { time: "15:30", title: "Maya · swimming", person: "Dad", color: "bg-family-yellow" },
  { time: "18:00", title: "Piano practice", person: "Arjun", color: "bg-family-coral" },
];

const forecast = [
  { day: "Now", high: "17°", low: "", icon: Sun },
  { day: "Sun", high: "18°", low: "10°", icon: CloudSun },
  { day: "Mon", high: "16°", low: "9°", icon: CloudSun },
  { day: "Tue", high: "15°", low: "8°", icon: Sun },
];

const festivals = [
  { date: "11 OCT", name: "Navratri begins", kind: "Hindu festival", accent: "bg-festival-saffron" },
  { date: "20 OCT", name: "Dussehra", kind: "India · Hindu", accent: "bg-festival-mint" },
  { date: "31 OCT", name: "Halloween", kind: "United Kingdom", accent: "bg-festival-coral" },
  { date: "08 NOV", name: "Diwali", kind: "India · Hindu", accent: "bg-festival-yellow" },
];

type Mode = "photos" | "overview";

export function FamilyFrame() {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("photos");
  const [now, setNow] = useState(() => new Date());
  const [source, setSource] = useState<"immich" | "google">("immich");
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(clock);
  }, []);

  useEffect(() => {
    if (!playing) return;
    const slideshow = window.setInterval(
      () => setPhotoIndex((current) => (current + 1) % photos.length),
      8_000,
    );
    return () => window.clearInterval(slideshow);
  }, [playing]);

  const formatted = useMemo(
    () => ({
      time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now),
      date: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now),
    }),
    [now],
  );

  const movePhoto = (direction: number) => {
    setPhotoIndex((current) => (current + direction + photos.length) % photos.length);
  };

  const currentPhoto = photos[photoIndex];

  return (
    <main
      className="frame-shell"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const end = event.changedTouches[0]?.clientX ?? touchStart.current;
        if (Math.abs(end - touchStart.current) > 60) movePhoto(end > touchStart.current ? -1 : 1);
        touchStart.current = null;
      }}
    >
      <section className="photo-stage" aria-label="Family photo slideshow">
        {photos.map((photo, index) => (
          <img
            key={photo.src}
            src={photo.src}
            alt={index === 0 ? "A family laughing together at a garden picnic" : index === 1 ? "A family baking festive sweets together" : "A family walking beside a lake in autumn"}
            width={1536}
            height={1024}
            loading={index === 0 ? "eager" : "lazy"}
            className={`photo-image ${index === photoIndex ? "photo-image-active" : ""}`}
          />
        ))}
        <div className="photo-vignette" />
      </section>

      <header className="top-rail">
        <div className="clock-block">
          <div className="clock-time">{formatted.time}</div>
          <div className="clock-date">{formatted.date}</div>
        </div>

        <div className="mode-switch" aria-label="Display mode">
          <button className={mode === "photos" ? "mode-active" : ""} onClick={() => setMode("photos")} aria-label="Photo first view">
            <ImageIcon size={18} /> Photos
          </button>
          <button className={mode === "overview" ? "mode-active" : ""} onClick={() => setMode("overview")} aria-label="Family overview">
            <CalendarDays size={18} /> Overview
          </button>
        </div>

        <div className="weather-now">
          <Sun className="text-family-yellow" size={38} strokeWidth={1.7} />
          <div>
            <div className="weather-temp">17°</div>
            <div className="weather-place">Clear · London</div>
          </div>
        </div>
      </header>

      <aside className={`left-rail ${mode === "overview" ? "rail-expanded" : ""}`}>
        <div className="rail-title"><CalendarDays size={17} /> Today</div>
        <div className="agenda-list">
          {agenda.map((item) => (
            <article className="agenda-item" key={item.title}>
              <span className={`agenda-dot ${item.color}`} />
              <div>
                <time>{item.time}</time>
                <h2>{item.title}</h2>
                <p>{item.person}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="due-card">
          <div className="due-icon"><ListTodo size={18} /></div>
          <div><strong>2 due today</strong><span>Library books · PE kit</span></div>
        </div>
      </aside>

      <aside className={`right-rail ${mode === "overview" ? "rail-expanded" : ""}`}>
        <div className="rail-title"><CloudSun size={18} /> Forecast</div>
        <div className="forecast-list">
          {forecast.map(({ day, high, low, icon: Icon }) => (
            <div className="forecast-row" key={day}>
              <span>{day}</span><Icon size={20} /><strong>{high}</strong><small>{low}</small>
            </div>
          ))}
        </div>
        <div className="next-up">
          <span>COMING UP</span>
          <strong>Family film night</strong>
          <p>Friday · 19:00</p>
        </div>
      </aside>

      <div className="photo-caption">
        <Sparkles size={17} />
        <div><strong>{currentPhoto?.caption}</strong><span>{currentPhoto?.place}</span></div>
      </div>

      <div className="photo-controls">
        <button onClick={() => movePhoto(-1)} aria-label="Previous photo"><ChevronLeft /></button>
        <button className="play-control" onClick={() => setPlaying((value) => !value)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
          {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </button>
        <button onClick={() => movePhoto(1)} aria-label="Next photo"><ChevronRight /></button>
        <div className="slide-dots" aria-label={`Photo ${photoIndex + 1} of ${photos.length}`}>
          {photos.map((photo, index) => <span key={photo.src} className={index === photoIndex ? "dot-active" : ""} />)}
        </div>
      </div>

      <footer className="bottom-rail">
        <div className="festival-heading"><Sparkles size={18} /><span>On the family horizon</span></div>
        <div className="festival-list">
          {festivals.map((festival) => (
            <article className="festival-item" key={festival.name}>
              <span className={`festival-line ${festival.accent}`} />
              <div><time>{festival.date}</time><strong>{festival.name}</strong><small>{festival.kind}</small></div>
            </article>
          ))}
        </div>
        <button className="settings-button" onClick={() => setSettingsOpen(true)} aria-label="Open display settings"><Cog size={22} /></button>
      </footer>

      {settingsOpen && (
        <div className="settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSettingsOpen(false); }}>
          <section className="settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
            <header><div><span>FAMILY FRAME</span><h2 id="settings-title">Display settings</h2></div><button onClick={() => setSettingsOpen(false)} aria-label="Close settings"><X /></button></header>
            <div className="settings-content">
              <section><h3>Photo source</h3><div className="source-options">
                <button className={source === "immich" ? "source-active" : ""} onClick={() => setSource("immich")}><ImageIcon /><span><strong>Immich</strong><small>Self-hosted library</small></span>{source === "immich" && <Check />}</button>
                <button className={source === "google" ? "source-active" : ""} onClick={() => setSource("google")}><ImageIcon /><span><strong>Google Photos</strong><small>Shared family album</small></span>{source === "google" && <Check />}</button>
              </div></section>
              <section><h3>Slideshow</h3><div className="setting-row"><span>Change photo every</span><strong>8 seconds</strong></div><input aria-label="Slideshow timing" type="range" min="5" max="30" defaultValue="8" /></section>
              <section><h3>MagicMirror² module guide</h3><div className="module-grid">
                <Module name="MMM-Immich" use="Private photo library" />
                <Module name="MMM-GooglePhotos" use="Shared albums" />
                <Module name="weather" use="Current + forecast" />
                <Module name="calendar" use="Family iCal feeds" />
                <Module name="MMM-Todoist" use="Due-today tasks" />
                <Module name="Custom festival feed" use="UK, India + Hindu dates" />
              </div></section>
            </div>
            <footer><Settings2 size={17} /><span>Visual prototype · connections are not active</span></footer>
          </section>
        </div>
      )}
    </main>
  );
}

function Module({ name, use }: { name: string; use: string }) {
  return <div className="module-item"><strong>{name}</strong><span>{use}</span></div>;
}