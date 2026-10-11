import { describe, expect, it } from "vitest";
import { blendWallpapers } from "@/lib/wallpapers";

describe("blendWallpapers", () => {
  it("adds one wallpaper after every 5 family photos", () => {
    const out = blendWallpapers<number | string>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], ["w1", "w2"], 5);
    expect(out).toEqual([1, 2, 3, 4, 5, "w1", 6, 7, 8, 9, 10, "w2"]);
  });
  it("leaves family photos alone when mixing is off", () => {
    expect(blendWallpapers<number | string>([1, 2, 3], ["w"], 0)).toEqual([1, 2, 3]);
  });
});
