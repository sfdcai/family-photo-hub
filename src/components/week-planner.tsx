import { Cake, Check, ShoppingBasket, Star, Utensils, X } from "lucide-react";
import { useState } from "react";

import { MemberDot, useFamily, useMembers, type FamilyEvent } from "@/lib/family-store";
import { weekDays, type Person } from "./family-data";
import { WeatherIcon, weatherKindFromCode, weatherLabel } from "./weather-icon";

type Tab = "today" | "week" | "chores" | "meals" | "shopping";
const tabs: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "chores", label: "Chores" },
  { id: "meals", label: "Meals" },
  { id: "shopping", label: "Shopping" },
];

export function WeekPlanner({ todayIndex, nowMinutes }: { todayIndex: number; nowMinutes: number }) {
  const [tab, setTab] = useState<Tab>("today");
  const [detail, setDetail] = useState<FamilyEvent | null>(null);
  const { live } = useFamily();
  return (
    <section className="planner" aria-label="Weekly family planner">
      <div className="planner-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "tab-active" : ""} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
        <span className="planner-sample">{live ? "Live · synced" : "Sample data"}</span>
      </div>
      <div className="planner-body">
        {tab === "today" && <TodayBoard todayIndex={todayIndex} nowMinutes={nowMinutes} onOpen={setDetail} />}
        {tab === "week" && <WeekBoard todayIndex={todayIndex} onOpen={setDetail} />}
        {tab === "chores" && <ChoresBoard />}
        {tab === "meals" && <MealPlan todayIndex={todayIndex} />}
        {tab === "shopping" && <ShoppingList />}
      </div>
      {detail && (
        <div className="event-detail" role="dialog" aria-label={detail.title}>
          <MemberDot name={detail.person} />
          <div><small>{weekDays[detail.day]} · {detail.time} · {detail.kind}</small><strong>{detail.title}</strong><span>With {detail.person}</span></div>
          <button onClick={() => setDetail(null)} aria-label="Close details"><X /></button>
        </div>
      )}
    </section>
  );
}

const toMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };

function TodayBoard({ todayIndex, nowMinutes, onOpen }: { todayIndex: number; nowMinutes: number; onOpen: (e: FamilyEvent) => void }) {
  const { state } = useFamily();
  const today = state.events.filter((e) => e.day === todayIndex).sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
  const next = today.find((e) => toMinutes(e.time) >= nowMinutes) ?? today[0];
  const meal = state.meals[todayIndex];
  const { members, member } = useMembers();
  const kids: Person[] = members.filter((m) => m.kid).map((m) => m.name);
  const toBuy = state.shopping.filter((s) => !s.done);
  const birthday = [...state.birthdays].sort((a, b) => a.daysAway - b.daysAway)[0];
  const kind = weatherKindFromCode(state.weather.code);
  return (
    <div className="today-grid">
      <button className="today-card today-next" onClick={() => next && onOpen(next)}>
        <small>Next up</small>
        {next ? (<><strong>{next.title}</strong><span>{next.time} · {next.person}</span></>) : <strong>A calm day ahead</strong>}
        <div className="today-timeline">
          {today.map((e) => <span key={e.id} className={toMinutes(e.time) < nowMinutes ? "past" : ""} style={{ left: `${(toMinutes(e.time) - 360) / 10.8}%`, background: member(e.person).color }} title={e.title} />)}
          <i style={{ left: `${Math.min(100, Math.max(0, (nowMinutes - 360) / 10.8))}%` }} />
        </div>
      </button>
      <div className="today-card"><small><Utensils size={14} /> Dinner tonight</small><strong>{meal?.dinner ?? "Not planned yet"}</strong><span>Lunch · {meal?.lunch}</span></div>
      <div className="today-card today-weather"><WeatherIcon kind={kind} size={84} /><div><strong>{state.weather.temp}°</strong><span>{weatherLabel[kind]} · {state.weather.place}</span></div></div>
      <div className="today-card today-chores">
        <small>Chores race</small>
        <div className="rings">
          {kids.map((k) => {
            const mine = state.chores.filter((c) => c.person === k);
            const pct = mine.length ? mine.filter((c) => c.done).length / mine.length : 0;
            return (
              <div key={k} className="ring-wrap">
                <svg viewBox="0 0 44 44" className="chore-ring"><circle cx="22" cy="22" r="18" className="ring-bg" /><circle cx="22" cy="22" r="18" className="ring-fg" strokeDasharray={`${pct * 113} 113`} /></svg>
                <span>{member(k).icon} {k}</span>{pct === 1 && <Star size={16} fill="currentColor" className="chore-star" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="today-card"><small><ShoppingBasket size={14} /> Shopping</small><strong>{toBuy.length} to buy</strong><span>{toBuy.slice(0, 3).map((s) => s.item).join(" · ")}</span></div>
      {birthday && <div className="today-card today-birthday"><small><Cake size={14} /> Birthdays</small><strong>{birthday.daysAway === 0 ? `${birthday.name} is ${birthday.age} today!` : `${birthday.name} in ${birthday.daysAway} days`}</strong><span>Turning {birthday.age}</span></div>}
    </div>
  );
}

function WeekBoard({ todayIndex, onOpen }: { todayIndex: number; onOpen: (e: FamilyEvent) => void }) {
  const { state } = useFamily();
  return (
    <div className="week-grid">
      {weekDays.map((d, i) => (
        <div key={d} className={`week-col ${i === todayIndex ? "week-today" : ""}`}>
          <h3>{d}{i === todayIndex && <small>Today</small>}</h3>
          {state.events.filter((e) => e.day === i).sort((a, b) => toMinutes(a.time) - toMinutes(b.time)).map((e) => (
            <button key={e.id} className="week-event" onClick={() => onOpen(e)}>
              <MemberDot name={e.person} />
              <div><time>{e.time}</time><strong>{e.title}</strong><small>{e.person} · {e.kind}</small></div>
            </button>
          ))}
          <div className="week-meal"><Utensils size={13} /> {state.meals[i]?.dinner}</div>
        </div>
      ))}
    </div>
  );
}

function ChoresBoard() {
  const { state, update } = useFamily();
  const people: Person[] = useMembers().members.map((m) => m.name);
  return (
    <div className="chores-grid">
      {people.map((p) => {
        const mine = state.chores.filter((c) => c.person === p);
        const allDone = mine.length > 0 && mine.every((c) => c.done);
        return (
          <div key={p} className="chore-card">
            <h3><MemberDot name={p} />{p}{allDone && <span className="chore-star"><Star size={16} fill="currentColor" /> Superstar!</span>}</h3>
            {mine.map((c) => (
              <button key={c.id} className={`tick-row ${c.done ? "tick-done" : ""}`} onClick={() => update("chores", c.id, { done: !c.done })}>
                <span className="tick-box">{c.done && <Check size={16} />}</span>{c.title}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function MealPlan({ todayIndex }: { todayIndex: number }) {
  const { state } = useFamily();
  return (
    <div className="meal-grid">
      {state.meals.map((m, i) => (
        <div key={m.day} className={`meal-col ${i === todayIndex ? "week-today" : ""}`}>
          <h3>{m.day}</h3>
          <p><small>Breakfast</small>{m.breakfast}</p>
          <p><small>Lunch</small>{m.lunch}</p>
          <p><small>Dinner</small><strong>{m.dinner}</strong></p>
        </div>
      ))}
    </div>
  );
}

function ShoppingList() {
  const { state, update } = useFamily();
  const aisles = [...new Set(state.shopping.map((i) => i.aisle))];
  return (
    <div className="chores-grid">
      {aisles.map((a) => (
        <div key={a} className="chore-card">
          <h3>{a}</h3>
          {state.shopping.filter((i) => i.aisle === a).map((i) => (
            <button key={i.id} className={`tick-row ${i.done ? "tick-done" : ""}`} onClick={() => update("shopping", i.id, { done: !i.done })}>
              <span className="tick-box">{i.done && <Check size={16} />}</span>{i.item}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
