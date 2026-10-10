# Family Frame: birthdays, weekly planner, shopping and iPhone-friendly photos

## 1. Birthday celebrations
- On a family member's birthday, the frame shows a cheerful banner ("Happy 9th birthday, Maya!") with gentle confetti and balloons that float in for a few seconds every 15 minutes, then settle into a small badge.
- A countdown appears in "Coming up" a week ahead ("Arjun's birthday in 3 days").
- Birthdays sit in the bottom "family horizon" strip alongside festivals, with a cake marker.
- Confetti is skipped for anyone who prefers reduced motion.

## 2. Overview becomes a weekly family planner
Tapping **Overview** swaps the photo for a full week board (photos come back with one tap or after 2 minutes of no touches):
- **Week calendar:** Monday to Sunday columns showing events coloured by family member, with today highlighted.
- **Tasks and chores:** grouped by person, tick-off with a tap, and a star or sticker reward when kids finish theirs.
- **Activities:** clubs, lessons and pick-ups shown on the week.
- **Meals:** breakfast, lunch and dinner for each day.
- **Shopping list:** grouped by aisle (fruit and veg, dairy, Indian groceries, household), tap to tick off.
- Tabs along the top: Week, Chores, Meals, Shopping.
- Everything uses sample data for now and says that it's sample data.

## 3. Which iPhone app to use (shown in Settings as a guide)
Suggested best fit: **Apple Calendar + Apple Reminders**, which are free and already on your iPhone:
- Calendar: a shared iCloud "Family" calendar, published as a link the frame reads (MagicMirror `calendar` module).
- Chores, tasks and shopping: shared Reminders lists. These need a small bridge, for example an iPhone Shortcut that sends the lists to the frame, or a CalDAV reader.
- Meals: a "Meals" calendar in Apple Calendar.

Alternatives listed in the guide:
- **Todoist** (MMM-Todoist): the easiest way to get tasks and chores onto the frame.
- **Microsoft To Do** (MMM-MicrosoftToDo): free, and shares well.
- **Skylight / Cozi-style apps**: all-in-one for calendar, lists and meals, but harder to connect to MagicMirror.
- **AnyList / Bring!**: shopping and meal planning that sync with Siri and Reminders.
- **Mealie** (self-hosted, next to Immich): meal plans and shopping lists, with an iCal feed for meals.

## 4. Fixing photo gaps from iPhone pictures
iPhone photos are usually 4:3 (wider) or 3:4 (portrait), while the screen is 16:9. Two complementary fixes:
- **Smart fill:** the photo is shown in full, sharp, in the centre, and behind it a blurred, enlarged copy of the same photo fills the gaps. No black bars and nothing cropped off.
- **Portrait pairing:** two portrait photos are shown side by side, so they fill the screen nicely.
- Landscape photos that are close to 16:9 simply fill the screen, with faces kept away from the edges.
- A Settings option to choose: Smart fill / Fill screen (crop) / Fit (show whole photo).
- I'll add one portrait and one 4:3 sample photo to show this working.
- On the real frame: MMM-Immich and MMM-GooglePhotos both support a blurred background or "contain" mode, and the guide will mention the setting to use.

## Technical details
- Frontend-only, still keeping isolated display components: BirthdayCelebration, WeekPlanner (with tabs ChoresBoard, MealPlan, ShoppingList), PhotoSlide (blur-fill and portrait pairing using image natural dimensions), plus an extra iPhone integration section in the settings panel.
- Tick-off state lives in local component state only.
- All colours and motion use existing design tokens; check the layout at 1920x1080 and at smaller sizes.
