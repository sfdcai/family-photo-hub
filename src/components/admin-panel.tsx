import { Activity, CalendarDays, Cake, CloudSun, Download, Image as ImageIcon, Lock, MonitorSmartphone, Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { FamilyStoreProvider, useFamily, type Settings } from "@/lib/family-store";

/** Server-side configuration. Secret fields are write-only: the server returns `{ set: boolean }`. */
type Secret = { set: boolean } | string;
export type AdminConfig = {
  immichUrl: string; immichEmail: string; immichPassword: Secret; immichKey: Secret;
  immichAlbums: string[]; immichPeople: string[];
  googleAlbum: string; localFolder: boolean;
  place: string; lat: string; lon: string;
  calendars: { person: string; url: string }[];
  customFestivals: { date: string; name: string; kind: string }[];
  familyPin: Secret; adminPassword: Secret;
};
type Status = { name: string; ok: boolean; detail: string; at?: string }[];
type Option = { id: string; name: string };

const sampleConfig: AdminConfig = {
  immichUrl: "http://192.168.1.20:2283", immichEmail: "", immichPassword: { set: false }, immichKey: { set: false },
  immichAlbums: [], immichPeople: [], googleAlbum: "", localFolder: true,
  place: "London", lat: "51.5072", lon: "-0.1276",
  calendars: [{ person: "Family", url: "" }], customFestivals: [],
  familyPin: { set: true }, adminPassword: { set: false },
};

async function adminApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/admin${path}`, { credentials: "include", headers: { "content-type": "application/json" }, ...init });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `Error ${res.status}`);
  return res.status === 204 ? (null as T) : res.json();
}

export function AdminPanel() {
  return <FamilyStoreProvider><AdminGate /></FamilyStoreProvider>;
}

function AdminGate() {
  const { live } = useFamily();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!live) { setAuthed(true); return; }
    adminApi("/me").then(() => setAuthed(true)).catch(() => setAuthed(false));
  }, [live]);

  if (authed === null) return <div className="admin-shell"><p className="admin-muted">Loading…</p></div>;
  if (!authed) {
    return (
      <div className="admin-shell admin-login">
        <form className="phone-card phone-form" onSubmit={async (e) => {
          e.preventDefault(); setError("");
          try { await adminApi("/login", { method: "POST", body: JSON.stringify({ password }) }); setAuthed(true); }
          catch (err) { setError((err as Error).message); }
        }}>
          <h2><Lock size={20} /> Family Frame admin</h2>
          <p className="admin-muted">First time? Use the family PIN, then set an admin password under Security.</p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" aria-label="Admin password" autoFocus />
          {error && <p className="admin-error">{error}</p>}
          <button className="phone-primary">Sign in</button>
        </form>
      </div>
    );
  }
  return <AdminScreens />;
}

const sections = [
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "weather", label: "Weather", icon: CloudSun },
  { id: "calendar", label: "Calendar & festivals", icon: CalendarDays },
  { id: "family", label: "Birthdays", icon: Cake },
  { id: "frame", label: "Frame screen", icon: MonitorSmartphone },
  { id: "security", label: "Security", icon: Lock },
  { id: "system", label: "System", icon: Activity },
] as const;

function AdminScreens() {
  const { live, state, setSettings, add, remove } = useFamily();
  const s = state.settings;
  const [cfg, setCfg] = useState<AdminConfig>(sampleConfig);
  const [draft, setDraft] = useState<Partial<AdminConfig>>({});
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState<Status>([]);
  const [albums, setAlbums] = useState<Option[]>([]);
  const [people, setPeople] = useState<Option[]>([]);
  const view = { ...cfg, ...draft };

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(""), 3000); };
  useEffect(() => {
    if (!live) return;
    adminApi<AdminConfig>("/config").then(setCfg).catch(() => undefined);
    adminApi<Status>("/status").then(setStatus).catch(() => undefined);
  }, [live]);

  const set = <K extends keyof AdminConfig>(k: K, v: AdminConfig[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const save = async () => {
    if (!live) { setCfg(view); setDraft({}); flash("Saved (sample mode — saving happens on your home server)"); return; }
    try { setCfg(await adminApi<AdminConfig>("/config", { method: "PATCH", body: JSON.stringify(draft) })); setDraft({}); flash("Saved — the frame updates in a few seconds"); }
    catch (err) { flash((err as Error).message); }
  };
  const call = async (path: string, ok: string, init?: RequestInit) => {
    if (!live) { flash("Available on your home server"); return null; }
    try { const r = await adminApi<unknown>(path, init); flash(ok); return r; } catch (err) { flash((err as Error).message); return null; }
  };
  const testImmich = async () => {
    if (Object.keys(draft).length) await save();
    const r = await call("/test/immich", "Connected to Immich") as { photos?: number } | null;
    if (r) {
      flash(`Connected — ${r.photos ?? 0} photos found`);
      setAlbums(await adminApi<Option[]>("/immich/albums").catch(() => []));
      setPeople(await adminApi<Option[]>("/immich/people").catch(() => []));
    }
  };
  const findPlace = async () => {
    try {
      const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(view.place)}`).then((x) => x.json());
      const hit = r.results?.[0];
      if (!hit) return flash("Place not found");
      setDraft((d) => ({ ...d, place: hit.name, lat: String(hit.latitude), lon: String(hit.longitude) }));
      flash(`Found ${hit.name}, ${hit.country}`);
    } catch { flash("Couldn't search right now"); }
  };
  const toggle = (k: keyof Settings) => <Toggle label="" on={Boolean(s[k])} onChange={() => setSettings({ [k]: !s[k] } as Partial<Settings>)} />;
  const dirty = Object.keys(draft).length > 0;

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div><small>FAMILY FRAME</small><h1>Admin</h1></div>
        <span className={live ? "phone-live" : "phone-sample"}>{live ? "Home server" : "Sample mode"}</span>
      </header>
      <nav className="admin-nav">{sections.map(({ id, label, icon: Icon }) => <a key={id} href={`#${id}`}><Icon size={16} />{label}</a>)}</nav>

      <main className="admin-main">
        <Section id="photos" title="Photos" icon={ImageIcon}>
          <Field label="Photo source"><select value={s.source} onChange={(e) => setSettings({ source: e.target.value as Settings["source"] })}><option value="immich">Immich</option><option value="google">Google Photos</option></select></Field>
          <h3>Immich</h3>
          <Field label="Immich address"><input value={view.immichUrl} onChange={(e) => set("immichUrl", e.target.value)} placeholder="http://192.168.1.20:2283" inputMode="url" /></Field>
          <div className="phone-row">
            <Field label="Email"><input value={view.immichEmail} onChange={(e) => set("immichEmail", e.target.value)} placeholder="you@example.com" autoComplete="off" /></Field>
            <SecretField label="Password" value={view.immichPassword} onChange={(v) => set("immichPassword", v)} />
          </div>
          <SecretField label="Or an API key (optional, used instead of the password)" value={view.immichKey} onChange={(v) => set("immichKey", v)} />
          <button type="button" className="phone-secondary" onClick={testImmich}>Test connection & load albums</button>
          {albums.length > 0 && <Chips label="Albums to show (none = all photos)" options={albums} value={view.immichAlbums} onChange={(v) => set("immichAlbums", v)} />}
          {people.length > 0 && <Chips label="People to show (none = everyone)" options={people} value={view.immichPeople} onChange={(v) => set("immichPeople", v)} />}
          <h3>Other sources</h3>
          <Field label="Google Photos shared album link"><input value={view.googleAlbum} onChange={(e) => set("googleAlbum", e.target.value)} placeholder="https://photos.app.goo.gl/…" /></Field>
          <Toggle label="Also show the local photo folder" on={view.localFolder} onChange={() => set("localFolder", !view.localFolder)} />
          <h3>Slideshow</h3>
          <Field label={`Seconds per photo: ${s.intervalSec}`}><input type="range" min="5" max="60" value={s.intervalSec} onChange={(e) => setSettings({ intervalSec: Number(e.target.value) })} /></Field>
          <div className="phone-row">
            <Field label="Transition"><select value={s.transition} onChange={(e) => setSettings({ transition: e.target.value as Settings["transition"] })}><option value="fade">Fade</option><option value="slide">Slide</option><option value="zoom">Zoom</option><option value="flip">Flip</option></select></Field>
            <Field label="Display style"><select value={s.displayStyle} onChange={(e) => setSettings({ displayStyle: e.target.value as Settings["displayStyle"] })}><option value="slideshow">Slideshow</option><option value="wall">Photo wall</option></select></Field>
          </div>
          <Field label="Photo fit"><select value={s.fit} onChange={(e) => setSettings({ fit: e.target.value as Settings["fit"] })}><option value="smart">Smart fill</option><option value="cover">Fill screen</option><option value="contain">Fit</option></select></Field>
          <Row label="“On this day” memories">{toggle("memories")}</Row>
          <Row label="Pair portraits of the same person">{toggle("pairing")}</Row>
        </Section>

        <Section id="weather" title="Weather" icon={CloudSun}>
          <Field label="Town or city">
            <div className="admin-inline"><input value={view.place} onChange={(e) => set("place", e.target.value)} /><button type="button" className="phone-secondary" onClick={findPlace}>Find</button></div>
          </Field>
          <p className="admin-muted">Location: {view.lat}, {view.lon}</p>
          <Row label="Show future forecast">{toggle("showForecast")}</Row>
          <Row label="Temperature">
            <div className="admin-seg">{(["C", "F"] as const).map((u) => <button type="button" key={u} className={s.units === u ? "picked" : ""} onClick={() => setSettings({ units: u })}>°{u}</button>)}</div>
          </Row>
        </Section>

        <Section id="calendar" title="Calendar & festivals" icon={CalendarDays}>
          <p className="admin-muted">Paste iCloud or Google calendar links (iCloud: Calendar → share → Public calendar).</p>
          {view.calendars.map((c, i) => (
            <div key={i} className="admin-inline">
              <input className="admin-short" value={c.person} onChange={(e) => set("calendars", view.calendars.map((x, j) => (j === i ? { ...x, person: e.target.value } : x)))} placeholder="Who" aria-label="Calendar owner" />
              <input value={c.url} onChange={(e) => set("calendars", view.calendars.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} placeholder="webcal://…" aria-label="Calendar link" />
              <button type="button" className="admin-icon" onClick={() => set("calendars", view.calendars.filter((_, j) => j !== i))} aria-label="Remove calendar"><Trash2 size={18} /></button>
            </div>
          ))}
          <button type="button" className="phone-secondary" onClick={() => set("calendars", [...view.calendars, { person: "Family", url: "" }])}><Plus size={16} /> Add calendar</button>
          <h3>Holidays shown</h3>
          <Row label="UK bank holidays">{toggle("showUK")}</Row>
          <Row label="Indian holidays">{toggle("showIndia")}</Row>
          <Row label="Hindu festivals">{toggle("showHindu")}</Row>
          <h3>Your own dates</h3>
          {view.customFestivals.map((f, i) => (
            <div key={i} className="phone-item"><div><strong>{f.name}</strong><small>{f.date} · {f.kind}</small></div>
              <button type="button" onClick={() => set("customFestivals", view.customFestivals.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}><Trash2 size={18} /></button></div>
          ))}
          <AddFestival onAdd={(f) => set("customFestivals", [...view.customFestivals, f])} />
        </Section>

        <Section id="family" title="Birthdays" icon={Cake}>
          {state.birthdays.map((b) => (
            <div key={b.id} className="phone-item"><Cake size={18} /><div><strong>{b.name}</strong><small>{b.daysAway === 0 ? "Today!" : `In ${b.daysAway} days`} · turning {b.age}</small></div>
              <button onClick={() => remove("birthdays", b.id)} aria-label={`Delete ${b.name}`}><Trash2 size={18} /></button></div>
          ))}
          <AddBirthday onAdd={(b) => add("birthdays", b)} />
          <Row label="Birthday celebration on the frame">{toggle("celebrate")}</Row>
        </Section>

        <Section id="frame" title="Frame screen" icon={MonitorSmartphone}>
          <div className="phone-row">
            <Field label="Night mode from"><input type="time" value={s.nightStart} onChange={(e) => setSettings({ nightStart: e.target.value })} /></Field>
            <Field label="Until"><input type="time" value={s.nightEnd} onChange={(e) => setSettings({ nightEnd: e.target.value })} /></Field>
          </div>
          <Row label="Lite effects (older frames)">{toggle("lite")}</Row>
          <Row label="Today's agenda (left)">{toggle("showAgenda")}</Row>
          <Row label="Coming up (right)">{toggle("showComingUp")}</Row>
          <Row label="Festivals strip (bottom)">{toggle("showBottom")}</Row>
          <button type="button" className="phone-secondary" onClick={() => call("/reload", "Frame is reloading", { method: "POST" })}><RefreshCw size={16} /> Reload frame now</button>
        </Section>

        <Section id="security" title="Security" icon={Lock}>
          <SecretField label="Family PIN (for the phone app)" value={view.familyPin} onChange={(v) => set("familyPin", v)} numeric />
          <SecretField label="Admin password (for this page)" value={view.adminPassword} onChange={(v) => set("adminPassword", v)} />
          <button type="button" className="phone-secondary" onClick={() => call("/signout-all", "All phones and browsers signed out", { method: "POST" })}>Sign out all devices</button>
        </Section>

        <Section id="system" title="System" icon={Activity}>
          {status.length === 0 && <p className="admin-muted">{live ? "Checking services…" : "Service status appears when this page is opened from your home server."}</p>}
          {status.map((x) => (
            <div key={x.name} className="phone-item"><span className={`admin-dot ${x.ok ? "admin-ok" : "admin-bad"}`} /><div><strong>{x.name}</strong><small>{x.detail}{x.at ? ` · ${new Date(x.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}</small></div></div>
          ))}
          <div className="phone-row">
            <a className="phone-secondary admin-btn" href={live ? "/api/admin/backup" : undefined} onClick={(e) => { if (!live) { e.preventDefault(); flash("Available on your home server"); } }}><Download size={16} /> Backup</a>
            <label className="phone-secondary admin-btn"><Upload size={16} /> Restore
              <input type="file" accept="application/json" hidden onChange={async (e) => {
                const file = e.target.files?.[0]; if (!file) return;
                if (!window.confirm("Replace all family data with this backup?")) return;
                await call("/restore", "Backup restored", { method: "POST", body: await file.text() });
              }} />
            </label>
          </div>
        </Section>
      </main>

      {dirty && <div className="admin-savebar"><span>Unsaved changes</span><button className="phone-secondary" onClick={() => setDraft({})}>Undo</button><button className="phone-primary" onClick={save}>Save</button></div>}
      {toast && <div className="admin-toast" role="status">{toast}</div>}
    </div>
  );
}

function Section({ id, title, icon: Icon, children }: { id: string; title: string; icon: typeof Lock; children: ReactNode }) {
  return <section id={id} className="phone-card phone-form admin-section"><h2><Icon size={20} /> {title}</h2>{children}</section>;
}
function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="phone-field"><small>{label}</small>{children}</label>;
}
function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div className="admin-row"><span>{label}</span>{children}</div>;
}
function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: () => void }) {
  const btn = <button type="button" role="switch" aria-checked={on} aria-label={label || undefined} className={`admin-switch ${on ? "on" : ""}`} onClick={onChange}><span /></button>;
  return label ? <div className="admin-row"><span>{label}</span>{btn}</div> : btn;
}
function SecretField({ label, value, onChange, numeric }: { label: string; value: Secret; onChange: (v: string) => void; numeric?: boolean }) {
  const saved = typeof value === "object" && value.set;
  return (
    <Field label={label}>
      <input type="password" inputMode={numeric ? "numeric" : undefined} autoComplete="new-password" value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} placeholder={saved ? "Saved — type to replace" : "Not set"} />
    </Field>
  );
}
function Chips({ label, options, value, onChange }: { label: string; options: Option[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <Field label={label}>
      <div className="person-picker">{options.map((o) => (
        <button type="button" key={o.id} className={value.includes(o.id) ? "picked" : ""} onClick={() => onChange(value.includes(o.id) ? value.filter((x) => x !== o.id) : [...value, o.id])}>{o.name}</button>
      ))}</div>
    </Field>
  );
}
function AddFestival({ onAdd }: { onAdd: (f: { date: string; name: string; kind: string }) => void }) {
  const [name, setName] = useState(""); const [date, setDate] = useState(""); const [kind, setKind] = useState("Hindu festival");
  return (
    <div className="admin-inline">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Festival name" aria-label="Festival name" />
      <input className="admin-short" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Festival date" />
      <select className="admin-short" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Festival type"><option>Hindu festival</option><option>India</option><option>United Kingdom</option><option>Family</option></select>
      <button type="button" className="admin-icon" onClick={() => { if (name && date) { onAdd({ name, date, kind }); setName(""); setDate(""); } }} aria-label="Add festival"><Plus size={18} /></button>
    </div>
  );
}
function AddBirthday({ onAdd }: { onAdd: (b: { name: string; date: string; age: number; daysAway: number }) => void }) {
  const [name, setName] = useState(""); const [date, setDate] = useState("");
  return (
    <div className="admin-inline">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Birthday name" />
      <input className="admin-short" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date of birth" />
      <button type="button" className="admin-icon" aria-label="Add birthday" onClick={() => {
        if (!name || !date) return;
        const born = new Date(date); const today = new Date(); today.setHours(0, 0, 0, 0);
        const next = new Date(today.getFullYear(), born.getMonth(), born.getDate()); if (next < today) next.setFullYear(today.getFullYear() + 1);
        onAdd({ name, date, age: next.getFullYear() - born.getFullYear(), daysAway: Math.round((next.getTime() - today.getTime()) / 86_400_000) });
        setName(""); setDate("");
      }}><Plus size={18} /></button>
    </div>
  );
}
