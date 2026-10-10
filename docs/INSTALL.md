# Family Frame: home install guide

Family Frame has three parts:

- **Frame screen**: `http://SERVER:8080/frame` (on the Android frame)
- **Phone app**: `http://SERVER:8080/app` (on your iPhone, added to the home screen)
- **Server**: a single Docker container that stores your lists and connects to Immich, iCloud Calendar, the weather service and the holiday feeds

---

## 1. Create a container on Proxmox (about 10 minutes)

1. In Proxmox, go to **local → CT Templates → Templates** and download **debian-12-standard**.
2. Click **Create CT** and use these settings:
   - Hostname `familyframe`
   - 2 CPU, 2 GB RAM, 16 GB disk
   - Network: DHCP (later, set a fixed IP address in your router)
   - Options → Features: tick **nesting** and **keyctl** (Docker needs these)
3. Start the container, open its **Console** and run:
   ```sh
   apt update && apt install -y curl unzip
   curl -fsSL https://get.docker.com | sh
   ```
4. Copy this zip into the container, for example with `scp family-frame.zip root@<ip>:/root/`, then run:
   ```sh
   unzip family-frame.zip -d /opt && cd /opt/family-frame
   cp .env.example .env
   nano .env            # fill in PIN, location, Immich, calendars
   docker compose up -d --build
   ```
   The first build takes 5 to 10 minutes. Check it is running with `docker compose logs -f`.

## 2. Connect your services (`.env`)

| Setting | Where to get it |
|---|---|
| `FAMILY_PIN` | Choose any PIN. It is needed to change lists from the phone. |
| `SESSION_SECRET` | Run `openssl rand -hex 32` and paste the result. |
| `LATITUDE` / `LONGITUDE` | Right-click your home in Google Maps to see them. |
| `IMMICH_URL` / `IMMICH_API_KEY` | In Immich: Account Settings → API Keys → New. |
| `IMMICH_PERSON_IDS` | Optional. Open a person in Immich; the ID is the last part of the address. |
| `ICAL_URLS` | On the iPhone: Calendar → Calendars → ⓘ next to "Family" → Public Calendar → Share Link. Write it as `Mum|link,Family|link`. |

Restart the server after changing settings: `docker compose up -d`.

### Google Photos
Google only lets apps read albums you pick each time, so the frame can't stream your Google library directly. Use either of these options:
- **Recommended:** import Google Photos into Immich (Google Takeout + `immich-go`). The frame then gets face recognition, which also enables same-person portrait pairs.
- **Simple:** run `docker compose --profile google up -d` to start the `gphotos-sync` helper. It keeps a local copy of one album; the first run asks you to sign in to Google (see the gphotos-sync docs). In the frame settings, choose **Google Photos**.

Any plain folder of pictures also works. Put them in `photos/local` and pick that source.

## 3. iPhone app
1. Open Safari and go to `http://SERVER-IP:8080/app`.
2. Tap Share → **Add to Home Screen**.
3. The first time you change something, enter your family PIN. The phone remembers it for a year.

To reach the app away from home, install **Tailscale** on the Proxmox container and on your iPhone, then use the Tailscale address. Do not open port 8080 on your router.

## 4. The frame (Android 8)
**Before you start:** on the frame, update **Android System WebView** (or Chrome) from the Play Store. Version 100 or later is best.

**Option A: Fully Kiosk Browser**
1. Set the start URL to `http://SERVER-IP:8080/frame`.
2. Recommended settings:
   - Web Content → Enable JavaScript, Autoplay videos
   - Device → Keep screen on
   - Kiosk Mode → enabled
   - Motion detection (Plus) → wake on motion
   - Screen off / on timer → match the frame's night mode times
3. Touch, swipes and live updates all work.
4. Remote screen control and motion wake need **Fully Kiosk Plus**.

**Option B: the Family Frame APK** (folder `android/`)
1. Build it on the Proxmox container: `cd android && ./build-apk.sh`. This needs Docker and downloads about 3 GB once. Or open the folder in Android Studio → Build APK.
2. Copy `FamilyFrame.apk` to the frame, allow "unknown sources", and install it.
3. On first launch, enter `http://SERVER-IP:8080/frame`.
4. To change the address later, hold the **top-left corner for 4 seconds**.
5. What the app does:
   - Starts when the frame boots and can be set as the home app
   - Keeps the screen on, with no status or navigation bars
   - Reconnects automatically if the server restarts

**Limitations on Android 8**
- An old WebView can't show some effects. If the frame feels slow, switch on **Lite effects** in Settings (on the frame or the phone). This removes the heavy blur effects.
- Fully dimming the screen at night only happens in the app's own night mode, which shows a dim clock. Turning the screen fully off needs Fully Kiosk's screen-off timer.
- HEIC photos are converted by the server, so iPhone photos are fine.

## 5. Updating, backups, festivals
- **Backup:** copy the `data/` folder. It holds the whole family database.
- **Update:** replace the `app/` and `server/` folders with a new version, then run `docker compose up -d --build`.
- **Festival dates:** these are in `server/festivals.json`. Hindu dates move each year with the lunar calendar. The 2026–27 dates are included; please check them against your local panchang and add more years in the same format. UK bank holidays update automatically from gov.uk.

## Folder map
```
app/          frame + phone UI source
server/       API: lists, photos, weather, calendars, festivals
android/      kiosk APK project
docker-compose.yml, Dockerfile, .env.example
```


## Admin page

Open `http://<server>:8080/admin` on a phone or computer at home. The first time, sign in with the family PIN, then set a separate admin password under **Security**.

From the admin page you can:
- **Photos** — Immich address, email + password (or an API key), test the connection, choose albums and people, Google Photos album, local folder, slideshow speed, transitions, photo wall, fit, "On this day" memories, portrait pairing
- **Weather** — find your town, turn the future forecast on or off, °C / °F
- **Calendar & festivals** — add or remove iCloud/Google calendar links per person, turn UK / Indian / Hindu dates on or off, add your own dates
- **Birthdays** — add or remove, turn the celebration on or off
- **Frame screen** — night hours, Lite effects, show or hide each side panel, reload the frame remotely
- **Security** — change the family PIN, change the admin password, sign out every phone
- **System** — live status of photos, weather and calendars, download a backup, restore a backup

Passwords and keys are kept on the server and are never shown again after saving. Changes reach the frame within seconds.
