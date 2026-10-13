"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAssistant } from "../state/assistant";
import { parsePoint } from "../domains/location";
import { geoDistance } from "../domains/maps";
import { Icon } from "./icons";
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      id="appDialog"
      aria-labelledby="dialogTitle"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const r = ref.current.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="dialog-head">
        <h2 id="dialogTitle">{title}</h2>
        <button
          id="closeDialog"
          className="iconbtn"
          onClick={onClose}
          aria-label="닫기"
          autoFocus
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="dialog-content">{children}</div>
    </dialog>
  );
}
export function CoordinateDialog({
  subject = false,
  onClose,
}: {
  subject?: boolean;
  onClose: () => void;
}) {
  const { state, setState, setPoint, requestGps, gpsBusy, notify } =
      useAssistant(),
    point = subject ? state.subject : state.observer;
  const [lat, setLat] = useState(String(point.lat)),
    [lng, setLng] = useState(String(point.lng));
  return (
    <Modal title={subject ? "피사체 B 좌표" : "위치 설정"} onClose={onClose}>
      <p>
        기기 위치는 GPS·Wi-Fi 등을 이용한 추정값입니다. 직접 위도·경도를 지정할
        수 있습니다.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          try {
            const p = parsePoint(lat, lng);
            if (subject) {
              if (geoDistance(p, state.observer) < 10)
                throw new Error("두 핀을 10m 이상 떨어뜨려 놓아주세요.");
              setState((s) => ({ ...s, subject: p }));
            } else setPoint(p);
            onClose();
          } catch (err) {
            notify((err as Error).message);
          }
        }}
      >
        <div className="location-form">
          <label>
            위도{" "}
            <input
              id="manualLat"
              type="number"
              step="any"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </label>
          <label>
            경도{" "}
            <input
              id="manualLng"
              type="number"
              step="any"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
            />
          </label>
        </div>
        <div className="dialog-actions">
          <button className="btn primary" id="manualSetLocation" type="submit">
            좌표 적용
          </button>
          {!subject && (
            <button
              type="button"
              className="btn light"
              disabled={gpsBusy}
              onClick={() => void requestGps()}
            >
              현재 위치 사용
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
export function LocationControls() {
  const { state, requestGps, gpsBusy } = useAssistant(),
    [open, setOpen] = useState(false);
  return (
    <>
      <button className="locbtn" onClick={() => setOpen(true)}>
        <Icon name="pin" />
        <span id="locationName">
          {state.source === "sample"
            ? "예시 좌표 · 서울"
            : state.source === "gps"
              ? `현재 위치 · ±${Math.round(state.accuracy ?? 0)}m`
              : "선택한 좌표"}
        </span>
      </button>
      <button
        className="btn primary"
        id="gpsQuickButton"
        disabled={gpsBusy}
        onClick={() => void requestGps()}
      >
        {gpsBusy ? "위치 확인 중" : "현재 위치 사용"}
      </button>
      {open && <CoordinateDialog onClose={() => setOpen(false)} />}
    </>
  );
}
export function SourceBanner() {
  const { state, day } = useAssistant();
  return (
    <div id="sourceBanner" className="source-banner" role="status">
      {state.source === "sample"
        ? "예시 위치"
        : state.source === "gps"
          ? "기기 추정 위치"
          : "직접 지정 위치"}{" "}
      ({state.observer.lat.toFixed(4)}, {state.observer.lng.toFixed(4)}) · {day}{" "}
      · 천문 근사 계산 · {state.timezoneSource} 시간대 {state.timezone} ·{" "}
      {state.followNow ? "현재" : "미리보기"}
    </div>
  );
}
export function Timeline({ planner = false }: { planner?: boolean }) {
  const { state, setState, bounds, minute, format, setMinute } = useAssistant();
  return (
    <>
      <div className="between">
        <h3>시간 선택</h3>
        <span className="time-read mono selectedTime" id="timeLabel">
          {format(minute)}
        </span>
        <button
          className="btn light"
          id={planner ? "plannerNow" : "goNow"}
          onClick={() =>
            setState((s) => ({ ...s, instant: Date.now(), followNow: true }))
          }
        >
          지금
        </button>
      </div>
      <input
        id={planner ? "plannerTime" : "fieldTime"}
        aria-label="촬영 시각"
        className="timeline-range"
        type="range"
        min="0"
        max={bounds.minutes - 1}
        step="1"
        value={minute}
        onChange={(e) => setMinute(Number(e.target.value))}
      />
      <div className="time-labels">
        {[0, 0.25, 0.5, 0.75, 1].map((n) => (
          <span key={n}>
            {format(
              n === 1 ? bounds.minutes - 1 : Math.round(bounds.minutes * n),
            )}
          </span>
        ))}
      </div>
      <p className="footnote">
        {state.timezone} · UTC 기준 · 날짜 길이 {bounds.minutes / 60}시간
      </p>
    </>
  );
}
export function AlignDialog({ onClose }: { onClose: () => void }) {
  const { state, setState, recommendation } = useAssistant(),
    delta = ((recommendation.bearing - state.heading + 540) % 360) - 180;
  return (
    <Modal title="촬영 방향" onClose={onClose}>
      <p>
        나침반 센서는 연결되지 않은 수동 데모입니다. 휴대폰과 미러리스의 방향은
        별개입니다.
      </p>
      <div className="align-number">{Math.round(recommendation.bearing)}°</div>
      <p>
        {Math.abs(delta) <= 3
          ? "목표 방향 부근입니다"
          : Math.abs(delta) === 180
            ? "반대 방향"
            : `${delta > 0 ? "오른쪽" : "왼쪽"}으로 약 ${Math.round(Math.abs(delta))}°`}
      </p>
      <label>
        수동 방위 {state.heading}°
        <input
          id="headingRange"
          type="range"
          min="0"
          max="359"
          value={state.heading}
          onChange={(e) =>
            setState((s) => ({ ...s, heading: Number(e.target.value) }))
          }
        />
      </label>
      <button className="btn primary" onClick={onClose}>
        확인
      </button>
    </Modal>
  );
}
