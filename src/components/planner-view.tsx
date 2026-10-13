"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAssistant } from "../state/assistant";
import { dateKey, timeLabel } from "../domains/timing";
import { intents } from "../state/model";
import { SkyChart } from "./diagrams";
import { Timeline } from "./controls";
const windowsList = [
  ["blueAM", "새벽 블루아워", "-6° → -4°"],
  ["goldenAM", "아침 골든아워", "-4° → +6°"],
  ["goldenPM", "저녁 골든아워", "+6° → -4°"],
  ["bluePM", "저녁 블루아워", "-4° → -6°"],
] as const;
export function PlannerView() {
  const {
      state,
      windows,
      day,
      format,
      setDate,
      setTimezone,
      setMinute,
      savePlan,
      loadPlan,
      deletePlan,
    } = useAssistant(),
    [consent, setConsent] = useState(false),
    router = useRouter();
  return (
    <section id="view-planner" className="view active" aria-label="시간 계획">
      <div className="pagehead">
        <h1>시간 계획</h1>
        <div className="head-controls">
          <span className="pill gray" id="plannerDateLabel">
            {day} · {state.timezone} · {state.timezoneSource}
          </span>
          <button
            className="btn light"
            id="plannerSave"
            onClick={() => savePlan(consent)}
          >
            계획 저장
          </button>
        </div>
      </div>
      <div className="planning-controls">
        <label>
          날짜{" "}
          <input
            id="planDate"
            type="date"
            value={day}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          IANA 시간대{" "}
          <input
            key={state.timezone}
            id="timezoneInput"
            defaultValue={state.timezone}
            onBlur={(e) => setTimezone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
          />
        </label>
        <small>
          좌표 기반 추정 · 경계 지역은 시간대를 확인하세요. DST 날짜는 실제
          23/25시간이며 중복 시각은 GMT 오프셋으로 구분합니다.
        </small>
      </div>
      <div className="planner-grid">
        <div>
          <div className="sky-panel">
            <h3>태양과 달의 고도</h3>
            <SkyChart />
            <div className="sky-legend">
              <span>
                <i />
                태양
              </span>
              <span>
                <i />달
              </span>
              <span>점선 = 수평선 0°</span>
            </div>
            <Timeline planner />
          </div>
          <div
            className="info-strip"
            id="solarEvents"
            style={{ marginTop: 14 }}
          >
            일출{" "}
            {windows.sunrise === null
              ? "해당 날짜에 없음"
              : format(windows.sunrise)}{" "}
            · 일몰{" "}
            {windows.sunset === null
              ? "해당 날짜에 없음"
              : format(windows.sunset)}
          </div>
          <div className="window-list">
            {windowsList.map(([id, label, threshold]) => {
              const w = windows[id];
              return (
                <button
                  key={id}
                  className="window-card"
                  disabled={!w}
                  onClick={() => w && setMinute(Math.round((w[0] + w[1]) / 2))}
                >
                  <span
                    className={`window-symbol ${id.startsWith("blue") ? "blue" : ""}`}
                  >
                    ○
                  </span>
                  <div>
                    <h3>{label}</h3>
                    <p>태양 고도 {threshold}</p>
                  </div>
                  <div className="window-time">
                    <strong>
                      {w
                        ? `${format(w[0])}–${format(w[1])}`
                        : "해당 날짜에 없음"}
                    </strong>
                    <small>고도 기반 근사 계산</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <div className="panel">
            <div className="between">
              <h3>시간별 촬영 조건</h3>
              <span className="pill gray">예보 예시</span>
            </div>
            <table className="forecast-table">
              <caption>시간별 날씨 · 예시 데이터</caption>
              <thead>
                <tr>
                  {["시각", "낮은 구름", "강수 확률", "바람"].map((v) => (
                    <th key={v}>{v}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[17, 18, 19].map((h, i) => (
                  <tr key={h}>
                    <td>{h}:00</td>
                    <td>{state.cloudy ? [88, 90, 92][i] : [12, 18, 26][i]}%</td>
                    <td>10%</td>
                    <td>{[2.4, 2.1, 1.8][i]} m/s</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="footnote">
              내장 예시 · 관측/예보 시각 없음 · 중층/상층 구름 제공 안 됨
            </p>
          </div>
          <div className="panel" style={{ marginTop: 18 }}>
            <div className="between">
              <h3>이 기기에 저장한 계획</h3>
              <span className="pill gray" id="savedCount">
                {state.plans.length}
              </span>
            </div>
            <label className="location-consent">
              <input
                id="saveLocationConsent"
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              계획에 정밀 좌표 포함 (선택)
            </label>
            <p className="footnote">
              기본 저장: 시각·장비·의도. 좌표 제외 계획은 현재 장소에서
              불러옵니다. 최대 5개를 저장하며 계획별 삭제 또는 내 장비에서 전체
              삭제할 수 있습니다.
            </p>
            <div id="savedPlans">
              {state.plans.length ? (
                state.plans
                  .slice()
                  .reverse()
                  .map((p) => (
                    <div className="saved-plan" key={p.id}>
                      <div className="between">
                        <strong>
                          {intents.find((i) => i[0] === p.intent)?.[1]} ·{" "}
                          {timeLabel(new Date(p.instant), p.timezone, true)}
                        </strong>
                        <button
                          aria-label="이 계획 삭제"
                          className="iconbtn"
                          onClick={() => deletePlan(p.id)}
                        >
                          ×
                        </button>
                      </div>
                      <small>
                        {dateKey(new Date(p.instant), p.timezone)} · {p.lens} mm
                        · {p.lat === undefined ? "좌표 제외" : "좌표 포함"}
                      </small>
                      <button
                        className="textlink"
                        onClick={() => {
                          loadPlan(p);
                          router.push("/");
                        }}
                      >
                        이 조건 불러오기 →
                      </button>
                    </div>
                  ))
              ) : (
                <div className="empty-plan">저장한 계획이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <p className="footnote">
        골든아워 -4°~+6°, 블루아워 -6°~-4°. 태양 중심 겉보기 고도 0°의 일출·일몰
        근사값입니다. 실제 차폐는 반영하지 않습니다.
      </p>
    </section>
  );
}
