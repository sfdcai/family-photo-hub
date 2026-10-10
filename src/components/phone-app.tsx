import { Cake, CalendarDays, Check, ListTodo, Settings2, ShoppingBasket, Trash2, Utensils } from "lucide-react";
import { useState, type FormEvent } from "react";

import { FamilyStoreProvider, parseQuickAdd, useFamily } from "@/lib/family-store";
import { personColor, weekDays, type Person } from "./family-data";

type Tab = "today" | "chores" | "meals" | "shopping" | "family" | "settings";
const tabs: { id: Tab; label: string; icon: typeof ListTodo }[] = [
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "chores", label: "Chores", icon: ListTodo },
  { id: "meals", label: "Meals", icon: Utensils },
  { id: "shopping", label: "Shop", icon: ShoppingBasket },
  { id: "family", label: "Family", icon: Cake },
  { id: "settings", label: "Frame", icon: Settings2 },
];
const people: Person[] = ["Mum", "Dad", "Maya", "Arjun", "Family"];

export function PhoneApp() {
  return <FamilyStoreProvider><PhoneScreens /></FamilyStoreProvider>;
}

function PhoneScreens() {
  const [tab, setTab] = useState<Tab>("today");
  const { live } = useFamily();
  return (
    <div className="phone-shell">
      <header className="phone-header">
        <div><small>FAMILY FRAME</small><h1>{tabs.find((t) => t.id === tab)?.label}</h1></div>
        <span className={live ? "phone-live" : "phone-sample"}>{live ? "Synced" : "Sample"}</span>
      </header>
      <main className="phone-main">
        {tab === "today" && <TodayScreen />}
        {tab === "chores" && <ChoresScreen />}
        {tab === "meals" && <MealsScreen />}
        {tab === "shopping" && <ShoppingScreen />}
        {tab === "family" && <FamilyScreen />}
        {tab === "settings" && <FrameSettings />}
      </main>
      <nav className="phone-nav">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={tab === id ? "phone-nav-active" : ""} onClick={() => setTab(id)}><Icon size={22} /><span>{label}</span></button>
        ))}
      </nav>
    </div>
  );
}

function PersonPicker({ value, onChange }: { value: Person; onChange: (p: Person) => void }) {
  return (
    <div className="person-picker">
      {people.map((p) => (
        <button type="button" key={p} className={value === p ? "picked" : ""} onClick={() => onChange(p)}><span className={`agenda-dot ${personColor[p]}`} />{p}</button>
      ))}
    </div>
  );
}

function TodayScreen() {
  const { state, add, remove } = useFamily();
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("17:00");
  const [day, setDay] = useState((new Date().getDay() + 6) % 7);
  const [person, setPerson] = useState<Person>("Family");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    add("events", { title: title.trim(), time, day, person, kind: "event" });
    setTitle("");
  };
  return (
    <>
      <form className="phone-card phone-form" onSubmit={submit}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add an event or activity" aria-label="Event title" />
        <div className="phone-row">
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} aria-label="Day">{weekDays.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
        </div>
        <PersonPicker value={person} onChange={setPerson} />
        <button className="phone-primary">Add to the week</button>
      </form>
      {weekDays.map((d, i) => {
        const list = state.events.filter((e) => e.day === i).sort((a, b) => a.time.localeCompare(b.time));
        if (!list.length) return null;
        return (
          <section key={d} className="phone-card">
            <h2>{d}</h2>
            {list.map((e) => (
              <div key={e.id} className="phone-item">
                <span className={`agenda-dot ${personColor[e.person]}`} /><div><strong>{e.title}</strong><small>{e.time} · {e.person}</small></div>
                <button onClick={() => remove("events", e.id)} aria-label={`Delete ${e.title}`}><Trash2 size={18} /></button>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}

function ChoresScreen() {
  const { state, add, update, remove } = useFamily();
  const [title, setTitle] = useState("");
  const [person, setPerson] = useState<Person>("Maya");
  return (
    <>
      <form className="phone-card phone-form" onSubmit={(e) => { e.preventDefault(); parseQuickAdd(title).forEach((t) => add("chores", { title: t, person, done: false })); setTitle(""); }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tidy room, feed the fish" aria-label="New chores" />
        <PersonPicker value={person} onChange={setPerson} />
        <button className="phone-primary">Add chores</button>
      </form>
      {people.map((p) => {
        const mine = state.chores.filter((c) => c.person === p);
        if (!mine.length) return null;
        return (
          <section key={p} className="phone-card">
            <h2><span className={`agenda-dot ${personColor[p]}`} /> {p}</h2>
            {mine.map((c) => <TickItem key={c.id} label={c.title} done={c.done} onToggle={() => update("chores", c.id, { done: !c.done })} onDelete={() => remove("chores", c.id)} />)}
          </section>
        );
      })}
    </>
  );
}

function MealsScreen() {
  const { state, setMeal } = useFamily();
  return (
    <>
      {state.meals.map((m) => (
        <section key={m.day} className="phone-card">
          <h2>{m.day}</h2>
          {(["breakfast", "lunch", "dinner"] as const).map((slot) => (
            <label key={slot} className="phone-field"><small>{slot}</small>
              <input value={m[slot]} onChange={(e) => setMeal({ ...m, [slot]: e.target.value })} />
            </label>
          ))}
        </section>
      ))}
    </>
  );
}

const aisles = ["Fruit & veg", "Dairy", "Indian groceries", "Bakery", "Household", "Other"];

function ShoppingScreen() {
  const { state, add, update, remove } = useFamily();
  const [text, setText] = useState("");
  const [aisle, setAisle] = useState("Other");
  const clearDone = () => state.shopping.filter((s) => s.done).forEach((s) => remove("shopping", s.id));
  return (
    <>
      <form className="phone-card phone-form" onSubmit={(e) => { e.preventDefault(); parseQuickAdd(text).forEach((item) => add("shopping", { item, aisle, done: false })); setText(""); }}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Milk, eggs and coriander" aria-label="Shopping items" />
        <select value={aisle} onChange={(e) => setAisle(e.target.value)} aria-label="Aisle">{aisles.map((a) => <option key={a}>{a}</option>)}</select>
        <button className="phone-primary">Add to list</button>
      </form>
      {[...new Set(state.shopping.map((s) => s.aisle))].map((a) => (
        <section key={a} className="phone-card">
          <h2>{a}</h2>
          {state.shopping.filter((s) => s.aisle === a).map((s) => <TickItem key={s.id} label={s.item} done={s.done} onToggle={() => update("shopping", s.id, { done: !s.done })} onDelete={() => remove("shopping", s.id)} />)}
        </section>
      ))}
      <button className="phone-secondary" onClick={clearDone}>Clear ticked items</button>
    </>
  );
}

function FamilyScreen() {
  const { state, add, remove } = useFamily();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name || !date) return;
    const born = new Date(date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const next = new Date(today.getFullYear(), born.getMonth(), born.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    add("birthdays", { name, date, age: next.getFullYear() - born.getFullYear(), daysAway: Math.round((next.getTime() - today.getTime()) / 86_400_000) });
    setName(""); setDate("");
  };
  return (
    <>
      <form className="phone-card phone-form" onSubmit={submit}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Name" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date of birth" />
        <button className="phone-primary">Add birthday</button>
      </form>
      <section className="phone-card">
        <h2>Birthdays</h2>
        {state.birthdays.map((b) => (
          <div key={b.id} className="phone-item"><Cake size={18} /><div><strong>{b.name}</strong><small>{b.daysAway === 0 ? "Today!" : `In ${b.daysAway} days`} · turning {b.age}</small></div>
            <button onClick={() => remove("birthdays", b.id)} aria-label={`Delete ${b.name}`}><Trash2 size={18} /></button></div>
        ))}
      </section>
    </>
  );
}

function FrameSettings() {
  const { state, setSettings } = useFamily();
  const s = state.settings;
  return (
    <section className="phone-card phone-form">
      <label className="phone-field"><small>Photo source</small>
        <select value={s.source} onChange={(e) => setSettings({ source: e.target.value as typeof s.source })}><option value="immich">Immich</option><option value="google">Google Photos</option></select></label>
      <label className="phone-field"><small>Photo fit</small>
        <select value={s.fit} onChange={(e) => setSettings({ fit: e.target.value as typeof s.fit })}><option value="smart">Smart fill</option><option value="cover">Fill screen</option><option value="contain">Fit</option></select></label>
      <label className="phone-field"><small>Seconds per photo: {s.intervalSec}</small>
        <input type="range" min="5" max="60" value={s.intervalSec} onChange={(e) => setSettings({ intervalSec: Number(e.target.value) })} /></label>
      <div className="phone-row">
        <label className="phone-field"><small>Night from</small><input type="time" value={s.nightStart} onChange={(e) => setSettings({ nightStart: e.target.value })} /></label>
        <label className="phone-field"><small>Until</small><input type="time" value={s.nightEnd} onChange={(e) => setSettings({ nightEnd: e.target.value })} /></label>
      </div>
      <TickItem label="Lite effects for older frames" done={s.lite} onToggle={() => setSettings({ lite: !s.lite })} />
    </section>
  );
}

function TickItem({ label, done, onToggle, onDelete }: { label: string; done: boolean; onToggle: () => void; onDelete?: () => void }) {
  return (
    <div className="phone-item">
      <button className={`tick-row ${done ? "tick-done" : ""}`} onClick={onToggle}><span className="tick-box">{done && <Check size={16} />}</span>{label}</button>
      {onDelete && <button onClick={onDelete} aria-label={`Delete ${label}`}><Trash2 size={18} /></button>}
    </div>
  );
}
