/**
 * Turns the frame's backlight off/on. Works in Fully Kiosk (its injected `fully` object)
 * and in the Family Frame Android app (`FamilyFrame` bridge). Brightness 0 rather than a
 * lock screen keeps the touchscreen alive, so a tap can still wake it.
 */
type Fully = { setScreenBrightness?: (v: number) => void; getScreenBrightness?: () => number; turnScreenOn?: () => void };
type Bridge = { setScreen?: (on: boolean) => void };

let saved = -1;
export function setScreenPower(on: boolean) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { fully?: Fully; FamilyFrame?: Bridge };
  try {
    if (w.FamilyFrame?.setScreen) { w.FamilyFrame.setScreen(on); return; }
    const f = w.fully;
    if (!f?.setScreenBrightness) return;
    if (on) { f.turnScreenOn?.(); if (saved >= 0) f.setScreenBrightness(saved); saved = -1; }
    else { if (saved < 0) saved = f.getScreenBrightness?.() ?? 200; f.setScreenBrightness(0); }
  } catch { /* not on a frame */ }
}
