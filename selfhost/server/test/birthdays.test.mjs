import { test } from "node:test";
import assert from "node:assert/strict";
import { birthdayInfo } from "../src/birthdays.mjs";

test("birthday today counts as 0 days away and new age", () => {
  assert.deepEqual(birthdayInfo("2017-10-10", new Date(2026, 9, 10)), { age: 9, daysAway: 0 });
});
test("birthday already passed this year rolls to next year", () => {
  assert.deepEqual(birthdayInfo("2019-10-07", new Date(2026, 9, 10)), { age: 8, daysAway: 362 });
});
