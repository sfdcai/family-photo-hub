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
Between "Screen sleeps at" and "Wakes at" (Admin → Frame screen, default 22:00–06:30) the screen backlight turns off — in Fully Kiosk (enable its JavaScript interface) or the Family Frame Android app. A tap wakes it for 5 minutes. Turn off "Turn the screen off while asleep" to keep a dim clock instead. The Fotocube has no camera or presence sensor, so wake is by schedule, tap or the phone remote. Lite effects removes blur and heavy animation for older Android WebViews.

## Bin collection
Set up each bin in Admin → Bin collection: name, emoji, colour, one collection date and how often (every 1, 2 or 4 weeks). The frame shows "Bins out tonight" from the evening reminder time (default 18:00) the day before, and "Bin day today" until noon. Tap the reminder (or "Mark as put out" in the phone app) once the bins are outside. The morning screen also lists bin day. 

**Automatic council dates.** At the top of Admin → Bin collection, type your council, fill in the details it asks for (usually postcode, house number or UPRN — the "How to find these details" link explains), press Test, then Save & use. Dates come from the community waste_collection_schedule project (300+ UK councils) running inside the home server, so bank-holiday and Christmas changes appear by themselves. They refresh twice a day and the last good dates are kept if the council site is down. You can still add bins by hand alongside.

## Day, evening and night
- **Day look:** bright photos.
- **Evening look** (from 19:00 until the morning screen ends, can be changed): a warm, dimmer tint over the photos and a golden clock. Admin → Frame screen lets you set it to Automatic, Always day or Always evening, and choose how much it dims.
- **Night clock** (night-mode hours): a dark screen with a floating moon and twinkling stars. Tap it to wake the frame for 5 minutes.

## Celebrations
Birthdays and festivals on their day get confetti, balloons, streamers, and fireworks. Admin → Frame screen → Celebration style lets you pick one style or all of them. Tap the banner to play the celebration again. Lite effects uses confetti only.

## Family members
Admin → Family members holds everyone (Da, Mum, Aariv, Arika by default): icon, colour, child or grown-up and a fun theme. Every screen — morning jobs, clubs, pickups, chores, the week planner, the phone app — uses this list. Renaming someone updates their morning jobs, clubs, pickups, countdowns, chores, calendar events and birthday everywhere at once. Children with the Spider-Man theme get a web-sling burst when they tick a morning job; the Unicorn theme gets rainbow sparkles.

## Simpler frame
- The frame has no settings button any more; everything is changed at `/admin` (link in the phone app's Frame tab).
- Photo details show only the place and date, just above the bottom strip.
- Previous / pause / next buttons fade away after 4 seconds and return on a tap.
- The bottom strip shows daylight left and sunset time, the next bin collection, birthdays and festivals with "In N days".

## Notes on the frame
Phone app → Today → "Note on the frame": a short note pinned on the frame's left side until midnight.

## Live Photos
iPhone Live Photos stored in Immich play their short motion once when they appear, then settle on the still (Admin → Photos → "Play Live Photos"; off with Lite effects). Choose which Immich albums and people appear under Admin → Photos after "Test connection".

## Remote control from the phone
Phone app → Frame tab: switch the frame to Morning / Photos / Overview, go to the previous or next photo, pause or play, replay a celebration, or put the screen to sleep and wake it. The same tab turns each part of the frame on or off and sets display style, transition, photo background (blurred, soft glow or plain dark), day/evening look, celebration style, weather effect strength and evening dimming.
