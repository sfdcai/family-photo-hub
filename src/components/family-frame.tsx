import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  Image as ImageIcon,
  ListTodo,
  MapPin,
  StickyNote,
  Moon,
  Pause,
  Play,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import familyBaking from "@/assets/family-baking.jpg";
import familyBirthday from "@/assets/family-birthday-portrait.jpg";
import familyKite from "@/assets/family-kite.jpg";
import familyLake from "@/assets/family-lake.jpg";
import familyMayaSwing from "@/assets/family-maya-swing.jpg";
import familyPicnic from "@/assets/family-picnic.jpg";
import { FamilyStoreProvider, MemberDot, useFamily } from "@/lib/family-store";
import { binReminder, countdownLabel, dayPhase, daylightLabel, daysUntil, isMorningWindow, localDateKey, nextBinDate } from "@/lib/routine";

import { AmbientWeather } from "./ambient-weather";
import { BirthdayCelebration } from "./birthday-celebration";
import { MorningLaunchpad } from "./morning-launchpad";
import { PhotoSlide, buildSlides, type Photo } from "./photo-slide";
import { PhotoWall } from "./photo-wall";
import { WeatherIcon, weatherKindFromCode, weatherLabel } from "./weather-icon";
import { WeekPlanner } from "./week-planner";
import { setScreenPower } from "@/lib/display";

const samplePhotos: Photo[] = [
  { src: familyPicnic, alt: "A family laughing together at a garden picnic", caption: "Strawberry negotiations", place: "Home", width: 1536, height: 1024, takenAt: "2025-07-12T13:00:00Z" },
  { src: familyBirthday, alt: "A girl blowing out birthday candles", caption: "Nine wishes, one breath", place: "Home", width: 768, height: 1024, people: ["Arika"], takenAt: "2025-10-04T17:30:00Z" },
  { src: familyBaking, alt: "A family baking festive sweets together", caption: "The great ladoo experiment", place: "Kitchen", width: 1536, height: 1024, takenAt: "2025-11-01T10:00:00Z" },
  { src: familyKite, alt: "A family flying a kite on a hill", caption: "The kite won, eventually", place: "Hampstead Heath", width: 1024, height: 768, takenAt: "2025-09-21T15:00:00Z" },
  { src: familyMayaSwing, alt: "A girl laughing on a garden swing", caption: "Higher! Higher!", place: "Garden", width: 768, height: 1024, people: ["Arika"], takenAt: "2025-08-16T12:00:00Z" },
  { src: familyLake, alt: "A family walking beside a lake in autumn", caption: "Last one to the lake!", place: "Lake District", width: 1536, height: 1024, takenAt: "2025-10-19T11:00:00Z" },
];

const accents = ["bg-festival-saffron", "bg-festival-mint", "bg-festival-coral", "bg-festival-yellow"];

type Mode = "photos" | "overview" | "morning";

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
  const [controlsOn, setControlsOn] = useState(true);
  const [mode, setMode] = useState<Mode>("photos");
  const [now, setNow] = useState(() => new Date());
  const [wokenAt, setWokenAt] = useState(0);
  const touchStart = useRef<number | null>(null);
  const slides = useMemo(() => buildSlides(photos, settings.pairing), [photos, settings.pairing]);

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

  // Commands sent from the phone app's remote control.
  const lastRemote = useRef(settings.remote.at);
  const [celebrateAt, setCelebrateAt] = useState(0);
  const [sleepAt, setSleepAt] = useState(0);
  useEffect(() => {
    const r = settings.remote;
    if (!r.at || r.at === lastRemote.current) return;
    lastRemote.current = r.at;
    if (Date.now() - r.at > 60_000) return; // ignore stale commands after a reload
    if (r.cmd === "morning" || r.cmd === "photos" || r.cmd === "overview") setMode(r.cmd);
    if (r.cmd === "next" || r.cmd === "prev") setPhotoIndex((c) => (c + (r.cmd === "next" ? 1 : -1) + slides.length) % slides.length);
    if (r.cmd === "pause") setPlaying(false);
    if (r.cmd === "play") setPlaying(true);
    if (r.cmd === "celebrate") setCelebrateAt(Date.now());
    if (r.cmd === "wake") { setWokenAt(Date.now()); setSleepAt(0); }
    if (r.cmd === "sleep") setSleepAt(Date.now());
  }, [settings.remote, slides.length]);

  // Photo buttons fade away after 4 seconds without a touch and come back on the next tap.
  useEffect(() => {
    if (!controlsOn) return;
    const t = window.setTimeout(() => setControlsOn(false), 4000);
    return () => window.clearTimeout(t);
  }, [controlsOn, photoIndex]);

  // Morning launchpad switches on at the start of the window and back to photos at the end.
  const inMorning = settings.morningOn && isMorningWindow(now, settings.morningStart, settings.morningEnd, settings.morningWeekends);
  useEffect(() => { setMode(inMorning ? "morning" : "photos"); }, [inMorning]);

  // Return to the default view after 2 minutes without a touch in overview.
  useEffect(() => {
    if (mode !== "overview") return;
    const back = () => setMode(inMorning ? "morning" : "photos");
    let timer = window.setTimeout(back, 120_000);
    const reset = () => { window.clearTimeout(timer); timer = window.setTimeout(back, 120_000); };
    window.addEventListener("pointerdown", reset);
    return () => { window.clearTimeout(timer); window.removeEventListener("pointerdown", reset); };
  }, [mode, inMorning]);

  const formatted = useMemo(() => ({
    time: new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now),
    date: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now),
  }), [now]);

  const todayIndex = (now.getDay() + 6) % 7;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const night = sleepAt > 0 || (isNight(now, settings.nightStart, settings.nightEnd) && now.getTime() - wokenAt > 5 * 60_000);
  const agenda = state.events.filter((e) => e.day === todayIndex).sort((a, b) => toMinutes(a.time) - toMinutes(b.time)).slice(0, 4);
  const due = state.chores.filter((c) => !c.done);
  const todayBirthday = state.birthdays.find((b) => b.daysAway === 0);
  const nextBirthday = state.birthdays.filter((b) => b.daysAway > 0 && b.daysAway <= 7).sort((a, b) => a.daysAway - b.daysAway)[0];
  const kind = weatherKindFromCode(weather.code);
  const deg = (c: number) => (settings.units === "F" ? Math.round(c * 9 / 5 + 32) : c);
  const festivals = state.festivals.filter((f) => {
    const k = f.kind.toLowerCase();
    if (k.includes("hindu")) return settings.showHindu;
    if (k.includes("india")) return settings.showIndia;
    if (k.includes("uk") || k.includes("united kingdom")) return settings.showUK;
    return true;
  });
  // Birthdays with a countdown join the strip; festivals get a chip inside their window.
  const horizon = [
    ...state.birthdays.filter((b) => b.daysAway > 0).map((b) => ({ name: `${b.name}'s birthday`, kind: `Turning ${b.age}`, date: b.daysAway === 1 ? "TOMORROW" : `IN ${b.daysAway} DAYS`, days: b.daysAway, countdown: countdownLabel(b.daysAway, settings.countdowns[b.name]) }))
      .filter((b) => b.countdown),
    ...festivals.map((f) => { const d = daysUntil(f.iso ?? f.date, now); return { ...f, days: d ?? 999, countdown: countdownLabel(d, settings.countdowns[f.name]) }; }),
  ].sort((a, b) => a.days - b.days);
  const phase = dayPhase(now, settings.look, settings.eveningStart, settings.morningEnd);
  const bins = binReminder(settings.bins, now, settings.binEvening);
  const binsDone = bins && settings.binsOut.date === now.toDateString() && bins.bins.every((b) => settings.binsOut.ids.includes(b.id));
  const festivalToday = horizon.find((f) => f.days === 0 && "kind" in f && !todayBirthday);
  const movePhoto = (d: number) => setPhotoIndex((c) => (c + d + slides.length) % slides.length);
  const currentPhoto = slides[photoIndex]?.[0];
  const photoInfo = [currentPhoto?.place, currentPhoto?.takenAt && new Date(currentPhoto.takenAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })].filter(Boolean).join(" · ");
  const daylight = daylightLabel(now, weather.sunrise, weather.sunset);
  const nextBins = settings.bins.map((b) => ({ b, d: nextBinDate(b, now) })).filter((x) => x.d).sort((x, y) => x.d!.getTime() - y.d!.getTime());
  const nextBinDay = nextBins[0]?.d;
  const nextBinList = nextBinDay ? nextBins.filter((x) => x.d!.getTime() === nextBinDay.getTime()).map((x) => x.b) : [];
  const binDays = nextBinDay ? Math.round((nextBinDay.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000) : null;
  const note = settings.note.text && settings.note.date === localDateKey(now) ? settings.note : null;
  // Real screen sleep: backlight off at night, back on at wake time or after a tap.
  const screenOff = night && settings.screenSleep;
  useEffect(() => { setScreenPower(!screenOff); }, [screenOff]);
  const whenLabel = (d: number) => (d <= 0 ? "Today" : d === 1 ? "Tomorrow" : `In ${d} days`);

  if (night) {
    return (
      <main className="frame-shell night-screen" onPointerDown={() => { setWokenAt(Date.now()); setSleepAt(0); }}>
        <div className="night-sky" aria-hidden="true">{Array.from({ length: 40 }, (_, i) => <span key={i} style={{ left: `${(i * 47) % 100}%`, top: `${(i * 29) % 70}%`, animationDelay: `${(i % 7) * 0.6}s` }} />)}</div>
        <Moon size={36} className="night-moon" />
        <div className="clock-time">{formatted.time}</div>
        <div className="clock-date">{formatted.date} · Sleep well</div>
        <small>Tap to wake</small>
      </main>
    );
  }

  return (
    <main
      className={`frame-shell ${mode !== "photos" ? "frame-overview" : ""} ${mode === "morning" ? "frame-morning" : ""} ${settings.lite ? "frame-lite" : ""} phase-${phase}`}
      onPointerDown={() => setControlsOn(true)}
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
            <PhotoSlide key={slide.map((p) => p.src).join("|")} photos={slide} fit={settings.fit} active={index === photoIndex} eager={index === 0} lite={settings.lite} transition={settings.transition} backdrop={settings.backdrop} playLive={settings.livePhotos && !settings.lite && mode === "photos"} />
          ))
        )}
        <div className="photo-vignette" />
        {phase === "evening" && <div className="evening-tint" style={{ opacity: settings.eveningDim / 100 }} />}
      </section>

      {settings.ambient && !settings.lite && mode === "photos" && <AmbientWeather code={weather.code} opacity={settings.ambientOpacity} />}
      {todayBirthday && settings.celebrate && mode === "photos" && <BirthdayCelebration key={`b${celebrateAt}`} name={todayBirthday.name} age={todayBirthday.age} style={settings.lite ? "confetti" : settings.celebrationStyle} />}
      {festivalToday && settings.celebrate && mode === "photos" && <BirthdayCelebration key={`f${celebrateAt}`} name={festivalToday.name} label={`Happy ${festivalToday.name}!`} style={settings.lite ? "confetti" : settings.celebrationStyle} />}
      {mode === "overview" && <WeekPlanner todayIndex={todayIndex} nowMinutes={nowMinutes} />}
      {mode === "morning" && <MorningLaunchpad now={now} todayIndex={todayIndex} deg={deg} onPhotos={() => setMode("photos")} />}

      <header className="top-rail">
        <div className="clock-block">
          <div className="clock-time">{formatted.time}</div>
          <div className="clock-date">{formatted.date}</div>
        </div>
        <div className="mode-switch" aria-label="Display mode">
          {settings.morningOn && <button className={mode === "morning" ? "mode-active" : ""} onClick={() => setMode("morning")} aria-label="Morning launchpad"><Sunrise size={18} /> Morning</button>}
          <button className={mode === "photos" ? "mode-active" : ""} onClick={() => setMode("photos")} aria-label="Photo first view"><ImageIcon size={18} /> Photos</button>
          <button className={mode === "overview" ? "mode-active" : ""} onClick={() => setMode("overview")} aria-label="Family overview"><CalendarDays size={18} /> Overview</button>
        </div>
        <div className="weather-now">
          <WeatherIcon kind={kind} size={64} />
          <div>
            <div className="weather-temp">{deg(weather.temp)}°</div>
            <div className="weather-place">{weatherLabel[kind]} · {weather.place}</div>
          </div>
        </div>
      </header>

      {settings.showAgenda && <aside className="left-rail">
        {note && <div className="note-card"><StickyNote size={16} /><p>{note.text}</p>{note.by && <small>— {note.by}</small>}</div>}
        <div className="rail-title"><CalendarDays size={17} /> Today</div>
        <div className="agenda-list">
          {agenda.length === 0 && <p className="rail-empty">Nothing planned — adventure time!</p>}
          {agenda.map((item) => (
            <article className="agenda-item" key={item.id}>
              <MemberDot name={item.person} />
              <div><time>{item.time}</time><h2>{item.title}</h2><p>{item.person}</p></div>
            </article>
          ))}
        </div>
        {bins && (
          <button className={`bin-card ${binsDone ? "is-done" : ""}`} onClick={() => setSettings({ binsOut: { date: now.toDateString(), ids: binsDone ? [] : bins.bins.map((b) => b.id) } })}>
            <span className="bin-dots">{bins.bins.map((b) => <i key={b.id} style={{ background: b.color }}>{b.emoji}</i>)}</span>
            <span><strong>{binsDone ? "Bins done ✅" : bins.when === "tonight" ? "Bins out tonight" : "Bin day today"}</strong><small>{bins.bins.map((b) => b.name).join(" · ")}</small></span>
          </button>
        )}
        <div className="due-card">
          <div className="due-icon"><ListTodo size={18} /></div>
          <div><strong>{due.length} chores to do</strong><span>{due.slice(0, 2).map((c) => c.title).join(" · ") || "All done!"}</span></div>
        </div>
      </aside>}

      {(settings.showForecast || settings.showComingUp) && <aside className="right-rail">
        {settings.showForecast && <>
        <div className="rail-title"><CloudSun size={18} /> Forecast</div>
        <div className="forecast-list">
          {weather.daily.map((d) => (
            <div className="forecast-row" key={d.day}>
              <span>{d.day}</span><WeatherIcon kind={weatherKindFromCode(d.code)} size={30} /><strong>{deg(d.high)}°</strong><small>{deg(d.low)}°</small>
            </div>
          ))}
        </div>
        </>}
        {settings.showComingUp && <div className="next-up">
          <span>COMING UP</span>
          {nextBirthday ? (<><strong>{nextBirthday.name}'s birthday</strong><p>in {nextBirthday.daysAway} days · turning {nextBirthday.age}</p></>) : (<><strong>Family film night</strong><p>Friday · 19:00</p></>)}
        </div>}
      </aside>}

      {photoInfo && settings.displayStyle !== "wall" && (
        <div className="photo-caption" key={photoIndex}><MapPin size={15} /><span>{photoInfo}</span></div>
      )}

      <div className={`photo-controls ${controlsOn ? "" : "controls-hidden"}`}>
        <button onClick={() => movePhoto(-1)} aria-label="Previous photo"><ChevronLeft /></button>
        <button className="play-control" onClick={() => setPlaying((v) => !v)} aria-label={playing ? "Pause slideshow" : "Play slideshow"}>
          {playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
        </button>
        <button onClick={() => movePhoto(1)} aria-label="Next photo"><ChevronRight /></button>
        <div className="slide-dots" aria-label={`Photo ${photoIndex + 1} of ${slides.length}`}>
          {slides.map((slide, index) => <span key={slide.map((p) => p.src).join("|")} className={index === photoIndex ? "dot-active" : ""} />)}
        </div>
      </div>

      {settings.showBottom && <footer className="bottom-rail">
        <div className="festival-heading"><Sparkles size={18} /><span>On the family horizon</span></div>
        <div className="festival-list">
          {daylight && <article className="festival-item horizon-sun"><span className="festival-line bg-festival-yellow" /><div><time>DAYLIGHT</time><strong>🌅 {daylight}</strong></div></article>}
          {nextBinList.length > 0 && binDays !== null && !binsDone && (
            <article className="festival-item"><span className="festival-line" style={{ background: nextBinList[0]!.color }} /><div><time>BINS · {whenLabel(binDays).toUpperCase()}</time><strong>{nextBinList.map((b) => `${b.emoji} ${b.name}`).join(" · ")}</strong></div></article>
          )}
          {todayBirthday && (
            <article className="festival-item"><span className="festival-line bg-festival-coral" /><div><time>TODAY</time><strong>🎂 {todayBirthday.name} turns {todayBirthday.age}</strong></div></article>
          )}
          {horizon.slice(0, 5 - (daylight ? 1 : 0) - (nextBinList.length && !binsDone ? 1 : 0) - (todayBirthday ? 1 : 0)).map((f, i) => (
            <article className={`festival-item ${f.countdown ? "has-countdown" : ""}`} key={f.name}>
              <span className={`festival-line ${accents[i % 4]}`} />
              <div><time>{f.date}</time><strong>{f.name}</strong><small className={f.countdown ? "countdown-chip" : ""}>{f.countdown ? `⏳ ${f.countdown}` : whenLabel(f.days)}</small></div>
            </article>
          ))}
        </div>
      </footer>}

    </main>
  );
}
