import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { birthdays as sampleBirthdays, initialChores, initialShopping, meals as sampleMeals, weekEvents, type Person } from "@/components/family-data";

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
export type Weather = { place: string; temp: number; code: number; daily: ForecastDay[] };
export type Settings = { fit: "smart" | "cover" | "contain"; intervalSec: number; nightStart: string; nightEnd: string; lite: boolean; source: "immich" | "google" };
export type Festival = { date: string; name: string; kind: string };

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
    place: "London", temp: 17, code: 0,
    daily: [
      { day: "Sun", high: 18, low: 10, code: 2 },
      { day: "Mon", high: 16, low: 9, code: 61 },
      { day: "Tue", high: 15, low: 8, code: 3 },
      { day: "Wed", high: 12, low: 5, code: 95 },
    ],
  },
  settings: { fit: "smart", intervalSec: 8, nightStart: "22:00", nightEnd: "06:30", lite: false, source: "immich" },
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
};

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
    const load = () => api("/state").then((s) => { if (!cancelled) setState(s as FamilyState); });
    fetch("/api/health")
      .then((r) => (r.ok && r.headers.get("content-type")?.includes("json") ? r.json() : null))
      .then((h) => {
        if (!h?.familyFrame || cancelled) return;
        setLive(true);
        void load();
        source = new EventSource("/api/stream");
        source.onmessage = () => void load();
      })
      .catch(() => undefined);
    return () => { cancelled = true; source?.close(); };
  }, []);

  const mutate = useCallback((local: (s: FamilyState) => FamilyState, remote: () => Promise<unknown>) => {
    setState(local);
    if (live) void remote().catch(() => undefined);
  }, [live]);

  const store = useMemo<Store>(() => ({
    state,
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
