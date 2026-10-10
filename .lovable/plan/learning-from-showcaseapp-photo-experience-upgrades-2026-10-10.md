# Learning from ShowcaseApp — photo experience upgrades

ShowcaseApp is a polished photo-frame player, but it has none of our family features (calendar, chores, meals, shopping, festivals, birthdays, phone app). We keep our design and borrow its best photo ideas.

## What we adopt

1. **Transition styles** — Settings gains a "Photo transition" choice: Fade (current), Slide, Zoom (slow Ken Burns drift), and Flip. Applied to the frame carousel; reduced-motion and Lite mode force Fade.
2. **Photo memory caption** — a small, elegant caption chip on the photo showing when/where it was taken (from Immich EXIF: date + city). Fades in after 2s, out before the next slide. Server passes EXIF fields through `/api/photos`; sample data gets example captions.
3. **Photo prefetching** — the frame preloads the next slide's image so transitions never show a blank or stutter (their caching commit inspired this; we do a simple `new Image()` prefetch of the next URL).
4. **Photo Wall mode** — a new display style alongside the carousel: a calm 3x2 bento-style grid of photos that slowly rotates one tile at a time. Selectable in Settings ("Display style: Slideshow / Photo Wall"). Lite mode keeps Slideshow only.

## What we deliberately skip

- WebDAV/SMB/FTP sources — Immich + Google Photos + local folder already cover your setup.
- AI image summaries, TMDB/Unsplash/Pexels sources — not relevant for a family frame.
- Duo Fold transition — needs Android 12+; your frame is Android 8.

## Technical notes

- `photo-slide.tsx`: transition variants + prefetch hook; new `photo-wall.tsx` component.
- `family-store.tsx` + server `photos.mjs`: carry `takenAt`/`place` EXIF fields per photo.
- Settings panel: two new options persisted through the existing settings API.
- Bundle (`/tmp/ffbundle`) updated to match; preview keeps working on sample data.
