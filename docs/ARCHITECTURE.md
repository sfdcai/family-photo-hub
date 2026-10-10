# How it is built

```text
 iPhone (/app) ─┐                       ┌─ Immich / folder photos
 Admin (/admin) ┼──► Home server :8080 ─┼─ Open-Meteo weather
 Frame (/frame) ┘    (Node + SQLite)    ├─ iCloud / Google calendars (iCal)
        ▲  live updates (SSE)           └─ gov.uk + festivals.json
        └────────────────────────────────
```

## Screens (`src/`)
- TanStack Start + React + Tailwind v4. Routes: `/` and `/frame` (frame), `/app` (phone), `/admin`.
- `src/lib/family-store.tsx` — the single data layer. If `/api/health` answers it reads `/api/state`, listens to `/api/stream` for changes and writes through the API; otherwise it uses sample data (so the screens work in any preview).
- `src/lib/routine.ts` — pure logic for the morning window, countdown windows, clothing advice, today's clubs and which ambient effect to show. Tested in `src/test/routine.test.ts`.
- Components: `family-frame.tsx` (frame shell and modes), `morning-launchpad.tsx`, `ambient-weather.tsx` (CSS-only animation), `week-planner.tsx`, `photo-slide.tsx`, `photo-wall.tsx`, `weather-icon.tsx`, `phone-app.tsx`, `admin-panel.tsx`.

## Settings
Display settings (including morning jobs, clubs, countdowns and ambient weather) are one JSON document stored by the server and synced to every screen. Server-side secrets (Immich password, calendars, PIN, admin password) live in a separate config table, override `.env`, and are never sent to a browser.

## Home server (`selfhost/`)
- `server/src/index.mjs` — HTTP API, PIN and admin sessions (signed cookies), SSE, serves the built screens.
- `db.mjs` (SQLite via `node:sqlite`), `photos.mjs` + `immich.mjs`, `weather.mjs`, `calendar.mjs`, `festivals.mjs`, `birthdays.mjs`.
- `Dockerfile` builds the screens with `NITRO_PRESET=node-server` from the repository root, then runs the server on Node 22. `docker-compose.yml` uses the repo root as build context.
- `android/` — a full-screen WebView kiosk app (boot start, immersive, auto-reconnect; hold top-left 4 s to change the address).
