# Features

## Frame modes
The top of the frame has three buttons: **Morning**, **Photos** and **Overview**.

### Morning launchpad
- Opens automatically between the times set in Admin → Morning routine (default 06:30–09:00, school days only; weekends optional). At the end time it switches back to photos.
- **Dress for today** — uses the current temperature, today's high and the weather (rain, snow, storm) to suggest clothes: raincoat and wellies, gloves and scarf, sun cream, "warmer later — easy-off layers".
- **Before we leave** — big buttons per child (and "Family") for morning jobs. Kids tap them on the frame; they tick with a small pop. Ticks reset each day. Jobs are edited in Admin.
- **School & clubs today** — before-school and after-school clubs for today's weekday with times, the kit to pack, and who picks up. Tonight's dinner from the meal plan is shown underneath.
- Tap **Show photos** or the **Photos** button to leave early.

### Photos
- Sources: Immich (email + password or API key; choose albums and people), Google Photos (via Immich import or gphotos-sync), or a local folder.
- Smart fill: blurred backdrop, soft feathered edges on small photos, two portraits side by side (same person when Immich recognises them).
- Transitions: fade, slide, zoom, flip. Display style: slideshow or photo wall.
- Caption with place and date; "On this day" memories.
- Swipe left/right, pause/play.

### Overview
Today, Week, Chores, Meals and Shopping tabs. Returns to the default view after 2 minutes without a touch.

## Weather
- Animated icons for sun, sunny spells, cloud, rain, snow, thunder and mist (rotating rays, drifting clouds, falling drops and flakes, flashing lightning).
- **Ambient weather** (Admin → Weather): full-screen rain streaks with drops on the glass, drifting snow, or rain with lightning flashes over the photos — only when the real weather is rain, snow or a storm. A strength slider (10–100%) controls how visible it is; lower is lighter on the frame. Off automatically with Lite effects, in the Morning/Overview screens and for anyone with reduced motion turned on.
- Future forecast can be hidden; °C or °F.

## Holidays, festivals and countdowns
- UK bank holidays (gov.uk, updates itself), Indian holidays and Hindu festivals (`selfhost/server/festivals.json`), plus your own dates (anniversaries, family days) from Admin.
- **Countdowns** (Admin → Countdowns): every birthday and festival has an on/off switch and "start showing" (3, 7, 14, 30, 60 or 100 days before). Within that window the bottom strip shows "⏳ In 5 days", "Tomorrow!", "Today!". Birthdays with a countdown join the strip too.
- On a birthday the frame celebrates with a banner (switchable).

## Phone app (iPhone)
Today, Chores, Meals, Shopping, Family and Settings tabs; quick-add ("milk, eggs and coriander" becomes three items); protected by the family PIN; live sync to the frame within a second.

## Admin page
Everything configurable in one place — see the Admin section of [INSTALL.md](INSTALL.md#admin-page). Passwords and keys are write-only.

## Night mode and Lite effects
Dim clock between night hours (tap to wake for 5 minutes). Lite effects removes blur and heavy animation for older Android WebViews.
