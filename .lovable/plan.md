# Family Frame: a complete self-hosted system for your Proxmox server

## What you'll get
1. **Frame screen**: the display you've seen, running on the Android 8 frame.
2. **Family phone app**: a phone-sized page you add to your iPhone home screen ("Add to Home Screen"). It opens like an app, and from there you add chores, meals, shopping items, birthdays and events, and change frame settings.
3. **Home server**: runs on Proxmox, stores everything, and talks to Immich, Google Photos, iCloud calendar and the weather service. Both screens read from it.
4. **Android app (APK)**: a small wrapper for the frame that opens the frame screen full-screen, keeps the screen awake, starts when the frame boots and dims at night. You can also just use Fully Kiosk with the same address.
5. **Docker Compose bundle** (a downloadable zip) with step-by-step Proxmox instructions.

MagicMirror² isn't needed any more: the server takes over its jobs (photos, calendar, weather, festivals), so you keep this exact design and full touch control. The module guide in Settings will be replaced with an "Integrations" status page.

## New features on the frame
- **Animated weather pictures**: drawn sun with turning rays, drifting clouds, falling rain, snowflakes and lightning, used for current weather and the forecast. Animations are turned off for anyone who prefers reduced motion.
- **Better overview**: a "Today" dashboard tab first, with the next event, dinner tonight, chores progress rings per child, shopping count, birthday countdown and weather. Then the Week, Chores, Meals and Shopping tabs. The week shows hour blocks, and you can tap any event or meal to see details.
- **Small photos**: low-resolution photos are shown at their natural sharp size with soft feathered edges that fade into a blurred, colour-matched background, instead of being stretched and blurry.
- **Portrait pairs of the same person**: the server groups portrait photos by the people Immich recognises, so two portraits of Maya appear side by side. Google Photos doesn't share face information, so it falls back to pairing photos taken close together in time.
- **"On this day"** memories, a favourite-photos boost, and a choice of which people or albums to show.
- **Night mode**: a dim clock-only screen at set hours. Any touch wakes it.

## Phone app (iPhone home screen)
- Tabs: Today, Chores, Meals, Shopping, Family (people, colours, birthdays), Settings.
- Quick-add box ("Milk, eggs, coriander" adds three items).
- Changes appear on the frame within a couple of seconds.
- Protected by a family PIN, and meant for use on your home network or through a private tunnel such as Tailscale.

## Fully Kiosk / Android 8: what works and the limits
- Touch, swipes, taps, animations and live updates all work.
- Android 8's built-in web viewer can be old. Update "Android System WebView" (or Chrome) from the Play Store, ideally to version 100 or later. I'll make the frame screen work on older viewers too, with simpler effects where needed.
- The heavy blur effects can be slow on weak frame hardware, so a "Lite effects" switch will be added.
- Fully Kiosk handles screen-on schedules and motion wake well. Some features (remote screen control, motion detection) need Fully Kiosk Plus.
- Photos are resized by the server to 1920x1080 so the frame loads them quickly.

## What I can and can't do from here
- I can build and test the frame screen, the phone app and all the server code here, with sample data in the preview.
- I can't connect to your home network, so Immich, Google Photos and iCloud are tested against sample responses. You'll add your own addresses and keys in a settings file.
- I can't produce a finished, signed APK file here. I'll include the ready-made Android project and a one-command build (it runs in Docker on your Proxmox server, or in Android Studio).

## Install steps (included in the guide)
```text
Proxmox -> Debian LXC with Docker -> unzip bundle -> edit settings file
-> docker compose up -d -> open http://<server>:8080/frame on the frame
-> open http://<server>:8080/app on the iPhone and Add to Home Screen
```

## Technical details
- Keep the TanStack app as the single UI codebase with routes `/` (frame), `/app/*` (mobile PWA with manifest and icons) and `/settings`. A data layer has two adapters: a sample adapter (used in the Lovable preview) and an HTTP adapter pointed at the self-hosted server's base URL. Update `AGENTS.md` to replace the "frontend-only prototype" rule.
- Server (bundled as `server/`): Node 20 + Fastify + SQLite (better-sqlite3), with a REST API for people, events, chores, meals, shopping, birthdays and settings, plus Server-Sent Events for live updates.
  - Photos: Immich API (people/faces for same-person pairing, small/blurry thumbnails detected by pixel size) and the Google Photos Picker API. Uses a sharp-based image proxy for resizing.
  - Weather: Open-Meteo (no key needed). Calendars: iCal/CalDAV (iCloud shared calendar). Festivals: a built-in UK bank holidays feed (gov.uk), Indian national holidays and a bundled Hindu festival table (tithi-based dates precomputed for the next few years).
  - Auth: family PIN, then a signed cookie.
- Docker Compose: `familyframe` (server + built UI), optional `caddy` for HTTPS, and volumes for the database and photo cache. Includes a `.env.example` and a README covering the Proxmox LXC setup.
- Android: a Capacitor project with minSdk 26 (Android 8), wake lock, auto-start on boot, a full-screen WebView and a configurable server URL. Built with a Gradle Docker build script.
- Frame screen compatibility: avoid features unsupported in older WebViews, add fallbacks for `backdrop-filter`/`inset`, and use a lite-effects mode.
- Animated weather icons built as inline SVG components with CSS keyframes, mapped from Open-Meteo weather codes.
- The deliverable zip goes to Files. Built in phases: (1) UI features + data layer, (2) server, (3) Docker bundle + guide, (4) Android project.
