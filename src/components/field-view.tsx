"use client";
import { useState } from "react";
import Link from "next/link";
import { useAssistant } from "../state/assistant";
import { intents, sensors } from "../state/model";
import { fixtureWeather } from "../domains/weather";
import { Icon } from "./icons";
import { Compass, MoonDisk } from "./diagrams";
import {
  AlignDialog,
  LocationControls,
  Modal,
  SourceBanner,
  Timeline,
} from "./controls";
export function FieldView() {
  const {
      state,
      setState,
      sky,
      recommendation: r,
      format,
      minute,
    } = useAssistant(),
    [dialog, setDialog] = useState<"align" | "reason" | null>(null),
    weather = fixtureWeather(state.cloudy);
  return (
    <section id="view-field" className="view active" aria-label="현장 가이드">
      <div className="pagehead">
        <h1>현장 가이드</h1>
        <div className="head-controls">
          <LocationControls />
        </div>
      </div>
      <SourceBanner />
      <div className="intent-tabs" role="group" aria-label="촬영 의도">
        {intents.map(([id, label, icon]) => (
          <button
            key={id}
            className={`intent-btn ${state.intent === id ? "active" : ""}`}
            aria-pressed={state.intent === id}
            onClick={() => setState((s) => ({ ...s, intent: id }))}
          >
            <Icon name={icon} />
            {label}
          </button>
        ))}
      </div>
      <div className="field-grid">
        <div className="instrument">
          <div className="between instrument-header">
            <h2>촬영 방향</h2>
            <span className="pill northpill">북쪽 고정</span>
          </div>
          <Compass />
          <div className="celestial-stats">
            <div className="celestial-item">
              <span className="symbol">
                <Icon name="sun" />
              </span>
              <div>
                <small>
                  태양 · {sky.sunAlt > 0 ? "수평선 위" : "수평선 아래"}
                </small>
                <b id="sunAz">{Math.round(sky.sunAz)}°</b>
                <small id="sunAlt">고도 {sky.sunAlt.toFixed(1)}°</small>
              </div>
            </div>
            <div className="celestial-item moon">
              <MoonDisk />
              <div>
                <small id="moonPhaseText">
                  {sky.moonName} · 밝은 면 {Math.round(sky.moonFraction * 100)}%
                </small>
                <b>{Math.round(sky.moonAz)}°</b>
                <small>
                  고도 {sky.moonAlt.toFixed(1)}°
                  {sky.moonAlt <= 0 ? " · 직접 촬영 불가" : ""}
                </small>
              </div>
            </div>
          </div>
          <p className="moon-note">
            달 원반은 밝은 면의 개념도 · 실제 하늘 회전 방향 미반영
          </p>
          <button
            className="btn gold full instrument-mobile-cta"
            onClick={() => setDialog("align")}
          >
            <Icon name="compass" />
            카메라 방향 맞추기
          </button>
        </div>
        <div className="field-right">
          <article className="recommendation">
            <div className="between">
              <span className="pill green">{r.badge}</span>
              <span className="rec-meta">{format(minute)}</span>
            </div>
            <h2 id="recTitle">{r.title}</h2>
            <div className="bearingline">
              카메라 방향 {Math.round(r.bearing)}° · {r.light}
            </div>
            <p>{r.desc}</p>
            <div className="rec-cta">
              <button
                className="btn primary"
                onClick={() => setDialog("align")}
              >
                <Icon name="compass" />
                방향 맞추기
              </button>
              <Link
                className="btn light"
                href="/map"
                aria-label="빛 지도에서 보기"
              >
                <Icon name="map" />
              </Link>
            </div>
            <button className="textlink" onClick={() => setDialog("reason")}>
              이 방향을 제안하는 이유 <Icon name="arrow" />
            </button>
          </article>
          <div className="weather">
            <div className="between">
              <span className="weather-title">날씨 · 예시</span>
              <button
                className="small"
                onClick={() => setState((s) => ({ ...s, cloudy: !s.cloudy }))}
              >
                {state.cloudy ? "맑은 예시" : "흐린 예시"} ↻
              </button>
            </div>
            <p className="footnote">
              {weather.source} · 중층/상층 구름: 제공 안 됨
            </p>
            <div className="weather-grid">
              {[
                ["기온", "19°C"],
                ["낮은 구름", `${weather.cloudLowPct}%`],
                ["강수 확률", "10%"],
                ["바람", "2.4 m/s"],
              ].map(([label, v]) => (
                <div key={label}>
                  <small>{label}</small>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="settings-card">
            <div className="between">
              <h3>추천 설정</h3>
              <Link href="/gear" className="small">
                {sensors[state.gear.sensor].name} · {state.gear.lens} mm
              </Link>
            </div>
            <div className="settings-values">
              {r.setting.map((v) => (
                <span className="value" key={v}>
                  {v}
                </span>
              ))}
            </div>
            <p>{r.note}</p>
          </div>
        </div>
      </div>
      <div className="timebox">
        <Timeline />
        <Link href="/planner" className="textlink">
          시간 계획 열기 <Icon name="arrow" />
        </Link>
      </div>
      <p className="footnote">
        천문 근사 계산 · 진북 기준 · 지형·건물·구름 차폐 미반영. 날씨는
        예시입니다.
      </p>
      {dialog === "align" && <AlignDialog onClose={() => setDialog(null)} />}
      {dialog === "reason" && (
        <Modal title="방향 추천 근거" onClose={() => setDialog(null)}>
          <h3>{r.title}</h3>
          <p>{r.desc}</p>
          <p>
            태양 {sky.sunAz.toFixed(1)}° / 고도 {sky.sunAlt.toFixed(1)}° · 달{" "}
            {sky.moonAz.toFixed(1)}° / 고도 {sky.moonAlt.toFixed(1)}°
          </p>
          <p>{r.note}</p>
          <div className="notice">
            천문 값은 근사 계산 결과입니다. 지형·건물·날씨의 차폐는 알 수
            없습니다.
          </div>
        </Modal>
      )}
    </section>
  );
}
