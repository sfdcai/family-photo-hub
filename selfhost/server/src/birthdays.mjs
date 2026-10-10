/** Computes age turning and days until the next birthday from an ISO date (YYYY-MM-DD). */
export function birthdayInfo(dateIso, today = new Date()) {
  const [y, m, d] = dateIso.split("-").map(Number);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(start.getFullYear(), m - 1, d);
  if (next < start) next = new Date(start.getFullYear() + 1, m - 1, d);
  return { age: next.getFullYear() - y, daysAway: Math.round((next - start) / 86_400_000) };
}
