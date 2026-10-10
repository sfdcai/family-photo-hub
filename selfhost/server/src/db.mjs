import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function openDb(file) {
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (collection TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY (collection, id));
    CREATE TABLE IF NOT EXISTS meals (day TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
  `);
  const insMeal = db.prepare("INSERT OR IGNORE INTO meals (day, data) VALUES (?, ?)");
  for (const day of DAYS) insMeal.run(day, JSON.stringify({ day, breakfast: "", lunch: "", dinner: "" }));
  db.prepare("INSERT OR IGNORE INTO settings (id, data) VALUES (1, ?)").run(
    JSON.stringify({ fit: "smart", intervalSec: 10, nightStart: "22:00", nightEnd: "06:30", lite: false, source: "immich" }),
  );
  db.prepare("INSERT OR IGNORE INTO config (id, data) VALUES (1, '{}')").run();
  return {
    list: (c) => db.prepare("SELECT data FROM items WHERE collection = ?").all(c).map((r) => JSON.parse(r.data)),
    put: (c, item) => db.prepare("INSERT OR REPLACE INTO items (collection, id, data) VALUES (?, ?, ?)").run(c, item.id, JSON.stringify(item)),
    get: (c, id) => { const r = db.prepare("SELECT data FROM items WHERE collection = ? AND id = ?").get(c, id); return r ? JSON.parse(r.data) : null; },
    remove: (c, id) => db.prepare("DELETE FROM items WHERE collection = ? AND id = ?").run(c, id),
    meals: () => DAYS.map((d) => JSON.parse(db.prepare("SELECT data FROM meals WHERE day = ?").get(d).data)),
    setMeal: (m) => db.prepare("UPDATE meals SET data = ? WHERE day = ?").run(JSON.stringify(m), m.day),
    settings: () => JSON.parse(db.prepare("SELECT data FROM settings WHERE id = 1").get().data),
    config: () => JSON.parse(db.prepare("SELECT data FROM config WHERE id = 1").get().data),
    setConfig: (c) => db.prepare("UPDATE config SET data = ? WHERE id = 1").run(JSON.stringify(c)),
    dump: () => ({ items: db.prepare("SELECT * FROM items").all(), meals: db.prepare("SELECT * FROM meals").all(), settings: db.prepare("SELECT data FROM settings").get().data }),
    restore: (b) => {
      db.exec("BEGIN");
      try {
        db.exec("DELETE FROM items");
        const ins = db.prepare("INSERT INTO items (collection, id, data) VALUES (?, ?, ?)");
        for (const r of b.items ?? []) ins.run(r.collection, r.id, r.data);
        for (const r of b.meals ?? []) db.prepare("INSERT OR REPLACE INTO meals (day, data) VALUES (?, ?)").run(r.day, r.data);
        if (b.settings) db.prepare("UPDATE settings SET data = ? WHERE id = 1").run(typeof b.settings === "string" ? b.settings : JSON.stringify(b.settings));
        db.exec("COMMIT");
      } catch (e) { db.exec("ROLLBACK"); throw e; }
    },
    setSettings: (s) => db.prepare("UPDATE settings SET data = ? WHERE id = 1").run(JSON.stringify(s)),
  };
}
