import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { birthdays as sampleBirthdays, initialChores, initialShopping, meals as sampleMeals, weekEvents, type Person } from "@/components/family-data";
import { defaultMembers, findMember, renameMember, type Bin, type Club, type CountdownRule, type Member, type MorningTask } from "@/lib/routine";

/**
 * Family data layer. When the page is served by the self-hosted Family Frame
 * server, `/api/health` answers and everything is read/written live (with
 * Server-Sent Events for instant updates). Otherwise sample data is used.
 */
export type Chore = { id: string; person: Person; title: string; done: boolean };
export type ShoppingItem = { id: string; aisle: string; item: string; done: boolean };
export type Meal = { day: string; breakfast: string; lunch: string; dinner: string };
export type FamilyEvent = { id: string; day: number; time: string; title: string; person: Person; kind: "event" | "activity" };
export type Birthday = { id: string; name: string; age: number; daysAway: number; date?: string };
export type ForecastDay = { day: string; high: number; low: number; code: number };
export type Weather = { place: string; temp: number; code: number; daily: ForecastDay[]; sunrise?: string; sunset?: string };
export type Settings = { fit: "smart" | "cover" | "contain"; intervalSec: number; nightStart: string; nightEnd: string; lite: boolean; source: "immich" | "google"; transition: "fade" | "slide" | "zoom" | "flip"; displayStyle: "slideshow" | "wall";
  showForecast: boolean; units: "C" | "F"; showAgenda: boolean; showComingUp: boolean; showBottom: boolean;
  showUK: boolean; showIndia: boolean; showHindu: boolean; memories: boolean; pairing: boolean; celebrate: boolean;
  ambient: boolean; ambientOpacity: number;
  morningOn: boolean; morningStart: string; morningEnd: string; morningWeekends: boolean;
  morningTasks: MorningTask[]; morningDone: { date: string; ids: string[] };
  clubs: Club[]; countdowns: Record<string, CountdownRule>;
  bins: Bin[]; binsOut: { date: string; ids: string[] }; binEvening: string;
  look: "auto" | "day" | "evening"; eveningStart: string; eveningDim: number;
  celebrationStyle: "mix" | "confetti" | "fireworks" | "lanterns";
  members: Member[]; livePhotos: boolean; note: { text: string; by: string; date: string };
  /** Behind photos that don't fill the screen. */
  backdrop: "blur" | "glow" | "dark";
  /** One-off command from the phone app; the frame acts when `at` changes. */
  remote: { cmd: RemoteCmd; at: number } };
export type RemoteCmd = "" | "morning" | "photos" | "overview" | "next" | "prev" | "pause" | "play" | "celebrate" | "wake" | "sleep";
export const defaultSettings: Settings = { fit: "smart", intervalSec: 8, nightStart: "22:00", nightEnd: "06:30", lite: false, source: "immich", transition: "fade", displayStyle: "slideshow",
  showForecast: true, units: "C", showAgenda: true, showComingUp: true, showBottom: true, showUK: true, showIndia: true, showHindu: true, memories: true, pairing: true, celebrate: true,
  ambient: true, ambientOpacity: 35,
  morningOn: true, morningStart: "06:30", morningEnd: "09:00", morningWeekends: false,
  morningTasks: [
    { id: "t1", title: "Make bed", emoji: "🛏️", person: "Arika" }, { id: "t2", title: "Brush teeth", emoji: "🪥", person: "Arika" }, { id: "t3", title: "Pack school bag", emoji: "🎒", person: "Arika" },
    { id: "t4", title: "Make bed", emoji: "🛏️", person: "Aariv" }, { id: "t5", title: "Brush teeth", emoji: "🪥", person: "Aariv" }, { id: "t6", title: "Shoes & coat on", emoji: "👟", person: "Aariv" },
    { id: "t7", title: "Lunchboxes & water bottles", emoji: "🥪", person: "Family" },
  ],
  morningDone: { date: "", ids: [] },
  clubs: [
    { id: "c1", person: "Arika", title: "Breakfast club", day: 0, start: "07:45", end: "08:45", when: "before", kit: "", pickup: "" },
    { id: "c2", person: "Aariv", title: "Cricket club", day: 0, start: "15:30", end: "17:00", when: "after", kit: "Bat, whites, water bottle", pickup: "Da" },
    { id: "c3", person: "Arika", title: "Swimming", day: 1, start: "15:30", end: "16:30", when: "after", kit: "Swim kit, towel, goggles", pickup: "Mum" },
    { id: "c4", person: "Aariv", title: "Football", day: 3, start: "15:20", end: "16:30", when: "after", kit: "Shin pads & boots", pickup: "Mum" },
    { id: "c5", person: "Arika", title: "Violin", day: 4, start: "08:00", end: "08:40", when: "before", kit: "Violin & music book", pickup: "" },
  ],
  countdowns: { Arika: { days: 14 }, Aariv: { days: 14 }, Diwali: { days: 30 } },
  bins: [
    { id: "b1", name: "General waste", emoji: "🗑️", color: "#3f3f46", every: 2, start: "2026-10-13" },
    { id: "b2", name: "Recycling", emoji: "♻️", color: "#2563eb", every: 2, start: "2026-10-20" },
    { id: "b3", name: "Food caddy", emoji: "🍎", color: "#16a34a", every: 1, start: "2026-10-13" },
  ],
  binsOut: { date: "", ids: [] }, binEvening: "18:00",
  look: "auto", eveningStart: "19:00", eveningDim: 30, celebrationStyle: "mix",
  members: defaultMembers, livePhotos: true, note: { text: "", by: "", date: "" },
  backdrop: "blur", remote: { cmd: "", at: 0 } };
export type Festival = { date: string; name: string; kind: string; iso?: string };

export type FamilyState = {
  chores: Chore[];
  shopping: ShoppingItem[];
  meals: Meal[];
  events: FamilyEvent[];
  birthdays: Birthday[];
  weather: Weather;
  settings: Settings;
  festivals: Festival[];
};

export const sampleState = (): FamilyState => ({
  chores: initialChores,
  shopping: initialShopping,
  meals: sampleMeals,
  events: weekEvents.map((e, i) => ({ ...e, id: `e${i}` })),
  birthdays: sampleBirthdays.map((b, i) => ({ ...b, id: `b${i}` })),
  weather: {
    place: "London", temp: 17, code: 0, sunrise: "07:21", sunset: "18:14",
    daily: [
      { day: "Sun", high: 18, low: 10, code: 2 },
      { day: "Mon", high: 16, low: 9, code: 61 },
      { day: "Tue", high: 15, low: 8, code: 3 },
      { day: "Wed", high: 12, low: 5, code: 95 },
    ],
  },
  settings: defaultSettings,
  festivals: [
    { date: "11 OCT", name: "Navratri begins", kind: "Hindu festival" },
    { date: "20 OCT", name: "Dussehra", kind: "India · Hindu" },
    { date: "31 OCT", name: "Halloween", kind: "United Kingdom" },
    { date: "08 NOV", name: "Diwali", kind: "India · Hindu" },
  ],
});

type Collection = "chores" | "shopping" | "events" | "birthdays";

type Store = {
  state: FamilyState;
  live: boolean;
  add: <C extends Collection>(c: C, item: Omit<FamilyState[C][number], "id">) => void;
  update: <C extends Collection>(c: C, id: string, patch: Partial<FamilyState[C][number]>) => void;
  remove: (c: Collection, id: string) => void;
  setMeal: (meal: Meal) => void;
  setSettings: (patch: Partial<Settings>) => void;
  /** Renames a person everywhere: jobs, clubs, pickups, countdowns, chores, events and birthdays. */
  renamePerson: (from: string, to: string, members: Member[]) => void;
};

/** In the preview (no home server) every page shares one saved copy, so admin, phone and frame stay in step. */
const SAMPLE_KEY = "familyframe-sample-v1";

const Ctx = createContext<Store | null>(null);

async function api(path: string, init?: RequestInit, retried = false): Promise<unknown> {
  const res = await fetch(`/api${path}`, { credentials: "include", headers: { "content-type": "application/json" }, ...init });
  if (res.status === 401 && !retried) {
    // Changes need the family PIN once per device; the server then remembers it.
    const pin = window.prompt("Enter the family PIN to make changes");
    if (pin) {
      const ok = await fetch("/api/login", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ pin }) });
      if (ok.ok) return api(path, init, true);
    }
  }
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export function FamilyStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FamilyState>(sampleState);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let source: EventSource | null = null;
    let cancelled = false;
    const load = () => api("/state").then((s) => { if (!cancelled) { const n = s as FamilyState; setState({ ...n, settings: { ...defaultSettings, ...n.settings } }); } });
    // Sample mode: pick up the shared copy, and follow changes made in other tabs/pages.
    try { const saved = window.localStorage.getItem(SAMPLE_KEY); if (saved) setState(JSON.parse(saved) as FamilyState); } catch { /* ignore */ }
    const onStorage = (e: StorageEvent) => { if (e.key === SAMPLE_KEY && e.newValue && !cancelled) { try { setState(JSON.parse(e.newValue) as FamilyState); } catch { /* ignore */ } } };
    window.addEventListener("storage", onStorage);
    fetch("/api/health")
      .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
      .then((h) => {
        if (!h?.familyFrame || cancelled) return;
        setLive(true);
        void load();
        source = new EventSource("/api/stream");
        source.onmessage = (e) => { if (e.data === "reload") window.location.reload(); else void load(); };
      })
      .catch(() => undefined);
    return () => { cancelled = true; source?.close(); window.removeEventListener("storage", onStorage); };
  }, []);

  // Save the shared sample copy whenever something changes (never in live mode — the server owns the data).
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (live) return;
    try { window.localStorage.setItem(SAMPLE_KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  }, [state, live]);

  const mutate = useCallback((local: (s: FamilyState) => FamilyState, remote: () => Promise<unknown>) => {
    setState(local);
    if (live) void remote().catch(() => undefined);
  }, [live]);

  const store = useMemo<Store>(() => ({
    // Fill in any setting missing from older saved data (or a hot-reloaded page) so new features never crash.
    state: { ...state, settings: { ...defaultSettings, ...state.settings } },
    live,
    add: (c, item) => {
      const id = `${c}-${Date.now()}-${Math.round(performance.now())}`;
      mutate((s) => ({ ...s, [c]: [...s[c], { ...item, id }] }), () => api(`/${c}`, { method: "POST", body: JSON.stringify({ ...item, id }) }));
    },
    update: (c, id, patch) =>
      mutate((s) => ({ ...s, [c]: (s[c] as { id: string }[]).map((x) => (x.id === id ? { ...x, ...patch } : x)) }), () => api(`/${c}/${id}`, { method: "PATCH", body: JSON.stringify(patch) })),
    remove: (c, id) =>
      mutate((s) => ({ ...s, [c]: (s[c] as { id: string }[]).filter((x) => x.id !== id) }), () => api(`/${c}/${id}`, { method: "DELETE" })),
    setMeal: (meal) =>
      mutate((s) => ({ ...s, meals: s.meals.map((m) => (m.day === meal.day ? meal : m)) }), () => api(`/meals/${meal.day}`, { method: "PUT", body: JSON.stringify(meal) })),
    setSettings: (patch) =>
      mutate((s) => ({ ...s, settings: { ...s.settings, ...patch } }), () => api(`/settings`, { method: "PATCH", body: JSON.stringify(patch) })),
    renamePerson: (from, to, members) => {
      const settings = { ...defaultSettings, ...state.settings };
      const patch: Partial<Settings> = { members, ...(from !== to ? renameMember(settings, from, to) : {}) };
      const swap = <T extends { id: string }>(list: T[], key: keyof T) => list.filter((x) => x[key] === from).map((x) => x.id);
      const changed = from === to ? null : { chores: swap(state.chores, "person"), events: swap(state.events, "person"), birthdays: swap(state.birthdays, "name") };
      mutate((s) => from === to ? { ...s, settings: { ...s.settings, ...patch } } : {
        ...s,
        settings: { ...s.settings, ...patch },
        chores: s.chores.map((c) => (c.person === from ? { ...c, person: to } : c)),
        events: s.events.map((e) => (e.person === from ? { ...e, person: to } : e)),
        birthdays: s.birthdays.map((b) => (b.name === from ? { ...b, name: to } : b)),
      }, async () => {
        await api(`/settings`, { method: "PATCH", body: JSON.stringify(patch) });
        if (!changed) return;
        await Promise.all([
          ...changed.chores.map((id) => api(`/chores/${id}`, { method: "PATCH", body: JSON.stringify({ person: to }) })),
          ...changed.events.map((id) => api(`/events/${id}`, { method: "PATCH", body: JSON.stringify({ person: to }) })),
          ...changed.birthdays.map((id) => api(`/birthdays/${id}`, { method: "PATCH", body: JSON.stringify({ name: to }) })),
        ]);
      });
    },
  }), [state, live, mutate]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useFamily() {
  const store = useContext(Ctx);
  if (!store) throw new Error("useFamily must be used inside FamilyStoreProvider");
  return store;
}

/** Splits "Milk, eggs and coriander" into separate shopping items. */
export function parseQuickAdd(text: string): string[] {
  return text
    .split(/,|\n|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1));
}

/** The family roster from settings; `member(name)` always returns something drawable. */
export function useMembers() {
  const { state } = useFamily();
  const members = state.settings.members?.length ? state.settings.members : defaultMembers;
  return { members, names: [...members.map((m) => m.name), "Family"], member: (name: string) => findMember(members, name) };
}

/** A coloured dot for a family member, used everywhere a person appears. */
export function MemberDot({ name }: { name: string }) {
  const { member } = useMembers();
  const m = member(name);
  return <span className="agenda-dot" style={{ background: m.color, color: m.color }} />;
}
