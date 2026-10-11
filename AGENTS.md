<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- All family data flows through `src/lib/family-store.tsx`: it uses the self-hosted server's `/api` when `/api/health` answers, otherwise sample data, because the same UI runs in the Lovable preview and on the family's Proxmox server.
- The self-hosted server, Docker setup and Android wrapper live in `selfhost/` (Dockerfile builds from the repo root); the UI is built for it with `NITRO_PRESET=node-server`, so keep server-side code Node-compatible and free of Lovable Cloud dependencies.
- The frame (`/`, `/frame`) and the phone app (`/app`) are separate route components sharing the store, so the frame can stay full-screen while the phone UI stays touch-first.
- Server-side config (Immich credentials, calendars, PIN, admin password) is edited at `/admin` and stored in the server SQLite `config` table, overriding `.env`; secrets are write-only (returned as `{set}`) so they never reach a browser.
- Morning routine, clubs, countdowns and ambient-weather options live inside the synced display `Settings` JSON, so they need no new server tables or endpoints; their pure logic stays in `src/lib/routine.ts` where it is unit-tested.
- User-facing guides live in `docs/` (INSTALL, FEATURES, ARCHITECTURE); update them when a feature or setup step changes.
- Family members (name, icon, colour, child, theme) live in the synced `Settings.members` list and every screen refers to people by name through `useMembers()`/`MemberDot`, so renaming happens in one place; the frame itself has no settings panel — all configuration is in `/admin` so children can't change it.
- Phone-to-frame remote commands travel as `Settings.remote = {cmd, at}` over the existing settings sync; the frame acts only when `at` changes and ignores commands older than a minute, so no extra endpoint is needed.

- Council bin dates come from the upstream `waste_collection_schedule` Python scrapers cloned into the Docker image and run via `selfhost/server/waste/fetch_bins.py`; results are written into `Settings.bins[].dates`, because reusing the community scrapers beats maintaining our own and keeps the frame logic unchanged.
- Screen sleep goes through `src/lib/display.ts` (Fully Kiosk `fully` object or the APK `FamilyFrame` bridge) using brightness 0 rather than locking, so the touchscreen can still wake the frame.
- Wallpaper sources are fetched and resized by `selfhost/server/src/wallpapers.mjs`; the curated painting list lives in `src/lib/art.json` (copied into the Docker image) so the preview and the server show the same art.
- The frame browser is Chromium 108 (Android 8 WebView/Fully Kiosk): Vite targets chrome108, colours use rgb()/rgba() (no oklch/color-mix), and JS avoids post-108 APIs (toSorted, Object.groupBy, Promise.withResolvers, Set.union, @starting-style), because newer features fail silently on the frame.
