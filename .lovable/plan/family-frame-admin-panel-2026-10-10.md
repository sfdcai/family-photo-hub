# Family Frame Admin Panel

A new **Admin** page at `/admin`, opened from a phone, tablet or computer on the home network. It holds every setting that today sits in the `.env` file, so after the first install you never need to edit files again.

## What the admin panel will control

**Photos**
- Immich: server address, email and password (or an API key instead), with a "Test connection" button that shows how many photos it can see
- Pick which Immich albums and people to show, from lists loaded from your server (no copying IDs)
- Google Photos album link, local photo folder on/off
- Seconds per photo, transition style, display style (slideshow / photo wall), photo fit, "On this day" memories on/off, portrait pairing on/off

**Weather**
- Place name and location (search by town name)
- Show future forecast on/off (hides the forecast column; current weather stays)
- Celsius / Fahrenheit

**Calendar and festivals**
- Add, rename and remove calendar links (iCloud, Google) and which person each belongs to
- Show UK holidays / Indian holidays / Hindu festivals, each on/off
- Add or correct festival dates

**Family**
- Family members: names and colours (replaces the fixed Mum, Dad, Maya, Arjun)
- Birthdays list, birthday celebration on/off

**Frame screen**
- Night mode hours, Lite effects, which side panels show (agenda, chores, coming up, bottom strip)
- "Reload frame now" button

**Security**
- Change the family PIN (for the phone app)
- Separate admin password for this panel
- Sign out all devices

**System**
- Status of each service (Immich, Google, calendars, weather) with last sync time and errors
- Download a backup of all family data, and restore from one

## How it behaves
- Admin needs its own password; the everyday phone app keeps the simple PIN.
- Passwords and keys are saved on your server only. The panel shows them as "saved" and never displays them again.
- Changes apply to the frame within seconds, no restart needed.
- In the preview here it runs with sample data; the real saving happens on your Proxmox server.

## Technical details
- New route `src/routes/admin.tsx` + `src/components/admin-panel.tsx`, touch-friendly, sectioned layout reusing the Midnight design.
- `Settings` type gains `showForecast`, `units`, panel toggles, festival source toggles, `memories`, `pairing`, `members`.
- `family-frame.tsx` hides the forecast column when `showForecast` is false.
- Server (bundle): new `config` table in SQLite overriding `.env`; endpoints `/api/admin/login`, `GET/PATCH /api/admin/config` (secrets write-only, returned as `{set: true}`), `/api/admin/test/immich`, `/api/admin/immich/albums|people`, `/api/admin/backup`, `/api/admin/restore`, `/api/admin/reload` (pushed over the existing SSE stream).
- Immich email/password: server logs in via `/api/auth/login`, keeps the access token, re-logs in on expiry; API key used if provided.
- Admin password hashed (scrypt); separate `ff_admin` cookie.
- Rebuild the zip bundle with the updated server and README section.
