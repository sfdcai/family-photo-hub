# Family Frame

A self-hosted family photo frame and home organiser for a 15.6" 1920×1080 Android touchscreen, with an iPhone companion app and an admin page. Runs on your own Proxmox server in one Docker container — no cloud accounts needed.

| Screen | Address | Used on |
|---|---|---|
| Frame | `http://SERVER:8080/frame` | The wall frame (Fully Kiosk or the bundled APK) |
| Phone app | `http://SERVER:8080/app` | iPhones, added to the home screen |
| Admin | `http://SERVER:8080/admin` | Any phone or computer at home |

## What it does

- **Photos** from Immich (or Google Photos / a local folder): smart fill for iPhone portraits, same-person portrait pairs, "On this day" memories, fade/slide/zoom/flip transitions, photo wall.
- **Overlay**: clock, animated weather and forecast, today's agenda, chores, UK + India holidays and Hindu festivals.
- **Morning launchpad** (06:30–09:00 by default): dress-for-the-weather advice, tap-to-tick morning jobs for each child, before/after school clubs with kit to pack and who picks up, tonight's dinner. Switches back to photos automatically.
- **Countdowns** for any birthday, anniversary or festival, starting a chosen number of days before.
- **Ambient weather**: optional full-screen rain, snow and thunder over the photos, with adjustable strength.
- **Week planner**: Today, Week, Chores, Meals and Shopping tabs; birthday celebrations; night mode; Lite effects for older frames.

## Documentation

- [Install on Proxmox, iPhone and the frame](docs/INSTALL.md)
- [Every feature explained](docs/FEATURES.md)
- [How it is built](docs/ARCHITECTURE.md)

## Quick start

```sh
git clone https://github.com/<you>/<repo>.git /opt/family-frame
cd /opt/family-frame/selfhost
cp .env.example .env && nano .env
docker compose up -d --build
```

## Developing

```sh
bun install
bun run dev          # screens on http://localhost:8080 with sample data
bunx vitest run      # screen logic tests
cd selfhost/server && npm ci && npm test   # server tests
```

Without the home server the screens run on built-in sample data, so you can design and test anywhere.
