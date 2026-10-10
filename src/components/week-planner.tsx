import { Check, Star } from "lucide-react";
import { useState } from "react";

import { initialChores, initialShopping, meals, personColor, weekDays, weekEvents, type Person } from "./family-data";

type Tab = "week" | "chores" | "meals" | "shopping";
const tabs: { id: Tab; label: string }[] = [
  { id: "week", label: "Week" },
  { id: "chores", label: "Chores" },
  { id: "meals", label: "Meals" },
  { id: "shopping", label: "Shopping" },
];

export function WeekPlanner({ todayIndex }: { todayIndex: number }) {
  const [tab, setTab] = useState<Tab>("week");
  return (
    <section className="planner" aria-label="Weekly family planner">
      <div className="planner-tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "tab-active" : ""} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
        <span className="planner-sample">Sample data</span>
      </div>
      <div className="planner-body">
        {tab === "week" && <WeekBoard todayIndex={todayIndex} />}
        {tab === "chores" && <ChoresBoard />}
        {tab === "meals" && <MealPlan todayIndex={todayIndex} />}
        {tab === "shopping" && <ShoppingList />}
      </div>
    </section>
  );
}

function WeekBoard({ todayIndex }: { todayIndex: number }) {
  return (
    <div className="week-grid">
      {weekDays.map((d, i) => (
        <div key={d} className={`week-col ${i === todayIndex ? "week-today" : ""}`}>
          <h3>{d}{i === todayIndex && <small>Today</small>}</h3>
          {weekEvents.filter((e) => e.day === i).map((e) => (
            <article key={e.title} className="week-event">
              <span className={`agenda-dot ${personColor[e.person]}`} />
              <div><time>{e.time}</time><strong>{e.title}</strong><small>{e.person} · {e.kind}</small></div>
            </article>
          ))}
          <div className="week-meal">🍽 {meals[i].dinner}</div>
        </div>
      ))}
    </div>
  );
}

function ChoresBoard() {
  const [chores, setChores] = useState(initialChores);
  const people: Person[] = ["Maya", "Arjun", "Mum", "Dad"];
  return (
    <div className="chores-grid">
      {people.map((p) => {
        const mine = chores.filter((c) => c.person === p);
        const allDone = mine.every((c) => c.done);
        return (
          <div key={p} className="chore-card">
            <h3><span className={`agenda-dot ${personColor[p]}`} />{p}{allDone && <span className="chore-star"><Star size={16} fill="currentColor" /> Superstar!</span>}</h3>
            {mine.map((c) => (
              <button key={c.id} className={`tick-row ${c.done ? "tick-done" : ""}`} onClick={() => setChores((all) => all.map((x) => x.id === c.id ? { ...x, done: !x.done } : x))}>
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
  return (
    <div className="meal-grid">
      {meals.map((m, i) => (
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
  const [items, setItems] = useState(initialShopping);
  const aisles = [...new Set(items.map((i) => i.aisle))];
  return (
    <div className="chores-grid">
      {aisles.map((a) => (
        <div key={a} className="chore-card">
          <h3>{a}</h3>
          {items.filter((i) => i.aisle === a).map((i) => (
            <button key={i.id} className={`tick-row ${i.done ? "tick-done" : ""}`} onClick={() => setItems((all) => all.map((x) => x.id === i.id ? { ...x, done: !x.done } : x))}>
              <span className="tick-box">{i.done && <Check size={16} />}</span>{i.item}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
