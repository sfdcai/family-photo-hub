const DAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
let cache = { at: 0, key: "", data: null };
export const weatherStatus = { ok: true, at: "", detail: "" };

export async function getWeather({ lat, lon, place }) {
  const key = `${lat},${lon},${place}`;
  if (cache.data && cache.key === key && Date.now() - cache.at < 15 * 60_000) return cache.data;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=5`;
    const j = await (await fetch(url)).json();
    const data = {
      place,
      temp: Math.round(j.current.temperature_2m),
      code: j.current.weather_code,
      sunrise: String(j.daily.sunrise?.[0] ?? "").slice(11, 16) || undefined,
      sunset: String(j.daily.sunset?.[0] ?? "").slice(11, 16) || undefined,
      daily: j.daily.time.slice(1, 5).map((t, i) => ({
        day: DAY[new Date(t).getDay()],
        high: Math.round(j.daily.temperature_2m_max[i + 1]),
        low: Math.round(j.daily.temperature_2m_min[i + 1]),
        code: j.daily.weather_code[i + 1],
      })),
    };
    cache = { at: Date.now(), key, data };
    Object.assign(weatherStatus, { ok: true, at: new Date().toISOString(), detail: `${data.temp}° in ${place}` });
    return data;
  } catch (err) {
    console.warn("weather failed", err.message);
    Object.assign(weatherStatus, { ok: false, at: new Date().toISOString(), detail: err.message });
    return cache.data ?? { place, temp: 0, code: 3, daily: [] };
  }
}
