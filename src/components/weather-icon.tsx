export type WeatherKind = "sun" | "partly" | "cloud" | "rain" | "snow" | "storm" | "fog";

/** Maps Open-Meteo weather codes to an animated icon kind. */
export function weatherKindFromCode(code: number): WeatherKind {
  if (code === 0 || code === 1) return "sun";
  if (code === 2) return "partly";
  if (code === 3) return "cloud";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if (code >= 95) return "storm";
  if (code >= 51) return "rain";
  return "cloud";
}

export const weatherLabel: Record<WeatherKind, string> = {
  sun: "Sunny", partly: "Sunny spells", cloud: "Cloudy", rain: "Rain", snow: "Snow", storm: "Thunder", fog: "Misty",
};

function Sun({ x = 32, y = 32, r = 11 }: { x?: number; y?: number; r?: number }) {
  return (
    <g className="wx-sun">
      <g className="wx-rays">
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1={x} y1={y - r - 4} x2={x} y2={y - r - 9} transform={`rotate(${i * 45} ${x} ${y})`} />
        ))}
      </g>
      <circle cx={x} cy={y} r={r} />
    </g>
  );
}

function Cloud({ dx = 0, dy = 0, className = "wx-cloud" }: { dx?: number; dy?: number; className?: string }) {
  return (
    <path className={className} transform={`translate(${dx} ${dy})`}
      d="M18 46h28a10 10 0 0 0 0-20 14 14 0 0 0-26.5-4A10 10 0 0 0 18 46z" />
  );
}

export function WeatherIcon({ kind, size = 48, label }: { kind: WeatherKind; size?: number; label?: string }) {
  return (
    <svg className={`wx wx-${kind}`} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={label ?? weatherLabel[kind]}>
      {kind === "sun" && <Sun />}
      {kind === "partly" && (<><Sun x={24} y={24} r={9} /><Cloud dx={6} dy={6} /></>)}
      {kind === "cloud" && (<><Cloud dx={-6} dy={-6} className="wx-cloud wx-cloud-back" /><Cloud dx={2} dy={2} /></>)}
      {kind === "fog" && (<><Cloud dx={0} dy={-6} /><g className="wx-fog"><line x1="12" y1="50" x2="52" y2="50" /><line x1="18" y1="57" x2="46" y2="57" /></g></>)}
      {(kind === "rain" || kind === "storm") && (
        <>
          <Cloud dx={0} dy={-6} />
          <g className="wx-drops">
            {[20, 30, 40].map((x, i) => <line key={x} x1={x} y1="46" x2={x - 3} y2="54" style={{ animationDelay: `${i * 0.3}s` }} />)}
          </g>
          {kind === "storm" && <path className="wx-bolt" d="M33 40l-6 11h6l-3 9 9-13h-6l3-7z" />}
        </>
      )}
      {kind === "snow" && (
        <>
          <Cloud dx={0} dy={-6} />
          <g className="wx-flakes">
            {[20, 32, 44].map((x, i) => <circle key={x} cx={x} cy="50" r="2.2" style={{ animationDelay: `${i * 0.5}s` }} />)}
          </g>
        </>
      )}
    </svg>
  );
}
