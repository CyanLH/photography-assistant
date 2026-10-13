"use client";
import { useMemo } from "react";
import { useAssistant } from "../state/assistant";
import { calculate, moonDiskSvg } from "../domains/astronomy";
export function point(angle: number, radius: number, cx = 200, cy = 200) {
  return {
    x: cx + radius * Math.sin((angle * Math.PI) / 180),
    y: cy - radius * Math.cos((angle * Math.PI) / 180),
  };
}
export function MoonDisk() {
  const { sky } = useAssistant();
  return (
    <span
      id="moonDisk"
      aria-label={`${sky.moonName}, 밝은 면 ${Math.round(sky.moonFraction * 100)}%`}
      dangerouslySetInnerHTML={{ __html: moonDiskSvg(sky.moonPhase, 42) }}
    />
  );
}
export function Compass() {
  const { sky, recommendation, fov, state } = useAssistant(),
    bearing = recommendation.bearing,
    sun = point(sky.sunAz, 151),
    moon = point(sky.moonAz, 109),
    left = point(bearing - fov / 2, 126),
    right = point(bearing + fov / 2, 126),
    target = point(bearing, 144),
    heading = point(state.heading, 76);
  return (
    <svg
      className="compass"
      id="compassSvg"
      viewBox="0 0 400 400"
      role="img"
      aria-label="진북 기준 태양·달·추천 촬영 방향"
    >
      <circle cx="200" cy="200" r="146" fill="none" stroke="#536c53" />
      {[80, 110, 130].map((r) => (
        <circle
          key={r}
          cx="200"
          cy="200"
          r={r}
          fill="none"
          stroke="#526c57"
          strokeDasharray="1 9"
        />
      ))}
      {Array.from({ length: 72 }, (_, i) => {
        const a = point(i * 5, 160),
          b = point(i * 5, i % 6 === 0 ? 150 : 155);
        return (
          <line
            key={i}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="#81947e"
            opacity=".6"
          />
        );
      })}
      {["N", "E", "S", "W"].map((label, i) => {
        const p = point(i * 90, 177);
        return (
          <text
            key={label}
            x={p.x}
            y={p.y + 4}
            textAnchor="middle"
            fill="#c1cbbd"
            fontSize="12"
          >
            {label}
          </text>
        );
      })}
      <path
        d={`M200 200 L${left.x} ${left.y} A126 126 0 0 1 ${right.x} ${right.y}Z`}
        fill="#a4ba89"
        fillOpacity=".15"
        stroke="#82936e"
        strokeOpacity=".4"
      />
      <line x1="200" y1="200" x2={sun.x} y2={sun.y} stroke="#ebbd65" />
      <line
        x1="200"
        y1="200"
        x2={moon.x}
        y2={moon.y}
        stroke="#a6a4d0"
        strokeDasharray="4 5"
      />
      <circle cx={sun.x} cy={sun.y} r="7" fill="#edbd64" />
      <circle cx={moon.x} cy={moon.y} r="6" fill="#65678c" />
      <line x1="200" y1="200" x2={target.x} y2={target.y} stroke="#b9d3a3" />
      <circle cx="200" cy="200" r="59" fill="#20372e" />
      <text x="200" y="183" textAnchor="middle" fill="#bcc9b6" fontSize="9">
        카메라 추천 방향
      </text>
      <text x="200" y="224" textAnchor="middle" fill="#f6eed3" fontSize="42">
        {Math.round(bearing)}°
      </text>
      <text x="200" y="247" textAnchor="middle" fill="#bcc9b6" fontSize="10">
        {state.gear.lens} mm · 화각 {fov.toFixed(1)}°
      </text>
      <circle cx={heading.x} cy={heading.y} r="4" fill="#bed3b0" />
      <text x="210" y="283" textAnchor="middle" fill="#9fb094" fontSize="9">
        수동 참고 방위 {state.heading}°
      </text>
    </svg>
  );
}
export function SkyChart() {
  const { bounds, state, sky, minute, windows } = useAssistant();
  const samples = useMemo(() => {
    const list = [];
    for (let t = 0; t < bounds.minutes; t += 10) {
      const a = calculate(new Date(bounds.start + t * 60000), state.observer);
      list.push({ t, sun: a.sunAlt, moon: a.moonAlt });
    }
    return list;
  }, [bounds, state.observer]);
  const x = (t: number) => 34 + (t / (bounds.minutes - 1)) * 464,
    y = (a: number) => 208 - ((a + 90) / 180) * 174;
  return (
    <svg
      id="skyChart"
      className="sky-chart"
      viewBox="0 0 520 240"
      role="img"
      aria-label="선택 날짜 태양과 달 고도"
    >
      <g>
        {(["goldenAM", "goldenPM", "blueAM", "bluePM"] as const).map((key) => {
          const w = windows[key];
          return w ? (
            <rect
              key={key}
              x={x(w[0])}
              y="18"
              width={x(w[1]) - x(w[0])}
              height="194"
              fill={key.startsWith("blue") ? "#b9bbec" : "#edbd64"}
              opacity=".13"
            />
          ) : null;
        })}
        {[-90, 0, 90].map((a) => (
          <g key={a}>
            <line
              x1="34"
              y1={y(a)}
              x2="500"
              y2={y(a)}
              stroke="#647961"
              strokeDasharray="2 5"
            />
            <text x="0" y={y(a)} fill="#bacbb2" fontSize="10">
              {a}°
            </text>
          </g>
        ))}
        {(["sun", "moon"] as const).map((body) => (
          <path
            key={body}
            d={samples
              .map((a, i) => `${i ? "L" : "M"}${x(a.t)} ${y(a[body])}`)
              .join(" ")}
            fill="none"
            stroke={body === "sun" ? "#edbd64" : "#b9bbec"}
            strokeWidth="2.5"
          />
        ))}
        <line
          x1={x(minute)}
          y1="18"
          x2={x(minute)}
          y2="212"
          stroke="#bacbb2"
          strokeDasharray="4 4"
        />
        <circle cx={x(minute)} cy={y(sky.sunAlt)} r="4" fill="#edbd64" />
        <text
          x={Math.max(35, Math.min(440, x(minute) + 8))}
          y={y(sky.sunAlt) - 9}
          fill="#edbd64"
          fontSize="11"
        >
          {sky.sunAlt.toFixed(1)}°
        </text>
      </g>
    </svg>
  );
}
