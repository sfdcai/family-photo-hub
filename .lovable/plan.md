# Family Frame visual prototype

## Experience
- Replace the blank home screen with a full-screen 16:9 family display designed specifically for 1920×1080.
- Keep a large animated photo stage in the center, with information arranged around all four edges so the image remains the emotional focus.
- Use the selected Midnight Family palette: deep charcoal/navy surfaces, warm yellow highlights, mint accents, and bright readable text.
- Use Outfit for headings and Figtree for supporting information, with large touch-friendly controls and strong across-the-room readability.

## Screen composition
- **Top edge:** current time and date on the left, location and live-style weather summary on the right.
- **Left edge:** today’s calendar agenda, due-today items, and family member color markers.
- **Right edge:** compact multi-day forecast and upcoming events.
- **Bottom edge:** combined India/UK holidays and Hindu festivals, plus subtle photo source and slideshow controls.
- **Center:** a polished family-photo carousel with smooth crossfades, gentle motion, captions, progress, pause/play, previous/next, and touch gestures.
- Make the display playful for children through cheerful microcopy, small celebratory details, and restrained motion—without becoming cartoonish or cluttered.

## Prototype behavior
- Use realistic sample family events, tasks, UK holidays, Indian holidays, and Hindu festival entries clearly presented as demonstration data.
- Add a touch-accessible mode switch between photo-first and overview states, preserving the central-photo layout.
- Include an unobtrusive settings panel that demonstrates photo-source choices for Immich and Google Photos, calendar visibility, family profiles, and slideshow timing without requiring accounts or a server connection.
- Add a module guide inside settings mapping the prototype areas to suitable MagicMirror² options: MMM-Immich, MMM-GooglePhotos, weather providers, calendar modules, task/calendar feeds, and a custom combined India/UK Hindu festival feed.
- Respect reduced-motion preferences and adapt cleanly below 1920×1080 for previewing on smaller screens.

## Visual assets
- Create a cohesive set of warm, natural family-life demo photographs for the carousel rather than using remote stock imagery.
- Use a subtle edge treatment behind information so text remains legible while the photographs stay bright and inspectable.

## Technical details
- Keep this as a frontend-only TanStack Start prototype with no login, database, or external account setup.
- Build focused components for the central slideshow, edge panels, forecast, agenda, festival strip, and settings overlay.
- Define all palette, typography, surface, and motion values as reusable design tokens.
- Add route-specific title, description, Open Graph, and Twitter metadata.
- Verify the result at 1920×1080 and a smaller viewport, including transitions, touch-sized controls, panel overflow, and reduced-motion behavior.
