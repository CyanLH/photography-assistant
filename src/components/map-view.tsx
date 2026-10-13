"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAssistant } from "../state/assistant";
import { destinationGeo, geoBearing, geoDistance } from "../domains/maps";
import { validatePoint, type Point } from "../domains/location";
import { loadGoogleMaps } from "../domains/google-loader";
import { sensors } from "../state/model";
import { CoordinateDialog } from "./controls";
import { point } from "./diagrams";
import { mapBackground } from "./map-background";
const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() || "";
const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() || "";
export function MapView() {
  const {
    state,
    setState,
    setPoint,
    sky,
    fov,
    setGear,
    recommendation,
    notify,
  } = useAssistant();
  const [mode, setMode] = useState<"observer" | "subject">("subject"),
    [dialog, setDialog] = useState<"observer" | "subject" | null>(null),
    [status, setStatus] = useState(key && mapId ? "loading" : "missing");
  const canvas = useRef<HTMLDivElement>(null),
    map = useRef<google.maps.Map | null>(null),
    markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const latest = useRef({ state, mode });
  useEffect(() => {
    latest.current = { state, mode };
  }, [state, mode]);
  useEffect(() => {
    if (!key || !mapId || !canvas.current) return;
    let disposed = false;
    const listeners: google.maps.MapsEventListener[] = [];
    const apply = (p: Point, which: "observer" | "subject") => {
      try {
        validatePoint(p);
        if (
          geoDistance(
            p,
            latest.current.state[which === "observer" ? "subject" : "observer"],
          ) < 10
        )
          throw new Error("두 핀을 10m 이상 떨어뜨려 놓아주세요.");
        if (which === "observer") setPoint(p, "map");
        else setState((s) => ({ ...s, subject: p }));
      } catch (e) {
        notify((e as Error).message);
      }
    };
    loadGoogleMaps(key)
      .then(async (maps) => {
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
          maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
        ]);
        if (disposed || !canvas.current) return;
        const instance = new Map(canvas.current, {
          center: latest.current.state.observer,
          zoom: 17,
          mapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          gestureHandling: "cooperative",
          clickableIcons: false,
        });
        map.current = instance;
        listeners.push(
          instance.addListener("click", (e: google.maps.MapMouseEvent) => {
            if (e.latLng) apply(e.latLng.toJSON(), latest.current.mode);
          }),
        );
        markers.current = (["observer", "subject"] as const).map((which, i) => {
          const content = document.createElement("div");
          content.className = `google-map-pin ${i ? "subject" : ""}`;
          content.textContent = i ? "B" : "A";
          const marker = new AdvancedMarkerElement({
            map: instance,
            position: latest.current.state[which],
            title: i ? "피사체 B" : "촬영자 A",
            content,
            gmpDraggable: true,
          });
          listeners.push(
            marker.addListener("dragend", () => {
              const p = marker.position;
              if (!p) return;
              const value = {
                lat: typeof p.lat === "function" ? p.lat() : p.lat,
                lng: typeof p.lng === "function" ? p.lng() : p.lng,
              };
              apply(value, which);
              marker.position = latest.current.state[which];
            }),
          );
          return marker;
        });
        setStatus("ready");
      })
      .catch((e) => {
        if (!disposed) {
          setStatus("error");
          notify((e as Error).message);
        }
      });
    return () => {
      disposed = true;
      listeners.forEach((l) => l.remove());
      markers.current.forEach((m) => {
        m.map = null;
      });
      markers.current = [];
      map.current = null;
    };
  }, [setPoint, setState, notify]);
  useEffect(() => {
    const instance = map.current;
    if (status !== "ready" || !instance || !window.google) return;
    const maps = window.google.maps,
      origin = state.observer,
      bearing = geoBearing(origin, state.subject),
      arc = [origin];
    for (let i = 0; i <= 18; i++)
      arc.push(destinationGeo(origin, bearing - fov / 2 + (fov * i) / 18, 220));
    arc.push(origin);
    const shapes: Array<google.maps.Polygon | google.maps.Polyline> = [
      new maps.Polygon({
        map: instance,
        paths: arc,
        strokeColor: "#59906b",
        fillColor: "#59906b",
        fillOpacity: 0.24,
        strokeOpacity: 0.5,
        clickable: false,
      }),
    ];
    for (const [end, color] of [
      [state.subject, "#204d37"],
      [destinationGeo(origin, sky.sunAz, 500), "#bd8732"],
      [destinationGeo(origin, sky.moonAz, 440), "#797cc6"],
    ] as const)
      shapes.push(
        new maps.Polyline({
          map: instance,
          path: [origin, end],
          strokeColor: color,
          strokeWeight: 2,
          clickable: false,
        }),
      );
    markers.current[0].position = origin;
    markers.current[1].position = state.subject;
    instance.panTo(origin);
    return () => shapes.forEach((shape) => shape.setMap(null));
  }, [status, state.observer, state.subject, sky.sunAz, sky.moonAz, fov]);
  const bearing = geoBearing(state.observer, state.subject),
    o = { x: 334, y: 300 },
    subject = point(bearing, 188, o.x, o.y),
    left = point(bearing - fov / 2, 350, o.x, o.y),
    right = point(bearing + fov / 2, 350, o.x, o.y),
    sun = point(sky.sunAz, 850, o.x, o.y),
    moon = point(sky.moonAz, 850, o.x, o.y);
  const schematic = (x: number, y: number) => {
    if (mode === "observer") {
      setDialog("observer");
      return;
    }
    const angle =
      ((((Math.atan2(x - o.x, -(y - o.y)) * 180) / Math.PI) % 360) + 360) % 360;
    setState((s) => ({
      ...s,
      subject: destinationGeo(s.observer, angle, 220),
    }));
  };
  const delta = Math.abs(((sky.sunAz - bearing + 540) % 360) - 180),
    light =
      sky.sunAlt < 0
        ? "직접 태양광 없음 · 잔광 방향 확인"
        : delta < 30
          ? "태양을 마주하는 역광 구도"
          : delta > 150
            ? "태양을 등지는 순광 구도"
            : "측광·사선광 후보";
  return (
    <section id="view-map" className="view active" aria-label="빛 지도">
      <div className="pagehead">
        <h1>빛 지도</h1>
        <Link className="btn light" href="/">
          현장 가이드
        </Link>
      </div>
      <div className="map-layout">
        <div
          className={`map-wrap ${status === "ready" ? "maps-ready" : ""}`}
          id="mapWrap"
        >
          <div className="google-map" id="googleMap" ref={canvas} />
          {status !== "ready" && (
            <svg
              id="mapSvg"
              className="map-canvas"
              viewBox="0 0 620 640"
              preserveAspectRatio="xMidYMid slice"
              role="img"
              aria-label="도식 미리보기. 실제 지리가 아닙니다. 화살표 키로 피사체 방향 변경"
              tabIndex={0}
              onClick={(e) => {
                const matrix = e.currentTarget.getScreenCTM();
                if (matrix) {
                  const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(
                    matrix.inverse(),
                  );
                  schematic(p.x, p.y);
                }
              }}
              onKeyDown={(e) => {
                const moves: Record<string, [number, number]> = {
                  ArrowLeft: [-5, 0],
                  ArrowRight: [5, 0],
                  ArrowUp: [0, -5],
                  ArrowDown: [0, 5],
                };
                const d = moves[e.key];
                if (d) {
                  e.preventDefault();
                  schematic(subject.x + d[0], subject.y + d[1]);
                }
              }}
            >
              <g dangerouslySetInnerHTML={{ __html: mapBackground }} />
              <path
                d={`M${o.x} ${o.y} L${left.x} ${left.y} A350 350 0 0 1 ${right.x} ${right.y}Z`}
                fill="#678967"
                fillOpacity=".22"
                stroke="#678967"
                strokeOpacity=".4"
              />
              {[
                [sun, "#ba852d"],
                [moon, "#8982b5"],
                [subject, "#284938"],
              ].map(([p, color], i) => (
                <line
                  key={i}
                  x1={o.x}
                  y1={o.y}
                  x2={(p as { x: number }).x}
                  y2={(p as { y: number }).y}
                  stroke={color as string}
                  strokeWidth="2"
                  strokeDasharray={i < 2 ? "7 5" : undefined}
                />
              ))}
              {[
                [o, "A"],
                [subject, "B"],
              ].map(([p, label]) => (
                <g key={label as string}>
                  <circle
                    cx={(p as { x: number }).x}
                    cy={(p as { y: number }).y}
                    r="15"
                    fill={label === "A" ? "#244a34" : "#fffefa"}
                    stroke="#fffefa"
                    strokeWidth="3"
                  />
                  <text
                    x={(p as { x: number }).x}
                    y={(p as { y: number }).y + 4}
                    textAnchor="middle"
                    fill={label === "A" ? "white" : "#244a34"}
                    fontSize="12"
                  >
                    {label as string}
                  </text>
                </g>
              ))}
            </svg>
          )}
          <div className="map-top">
            <div className="map-top-left">
              <div className="map-badge">
                {status === "ready"
                  ? "지도 클릭 또는 핀 드래그로 좌표 지정"
                  : "도식 미리보기 · 실제 지리가 아닙니다."}
              </div>
              <span
                className="map-provider-status"
                id="mapProviderStatus"
                role="status"
              >
                {status === "ready"
                  ? "GOOGLE MAPS · 선택 위치"
                  : status === "missing"
                    ? "GOOGLE MAPS 키와 MAP ID 필요"
                    : status === "error"
                      ? "GOOGLE MAPS 로딩 실패 · 도식"
                      : "GOOGLE MAPS 불러오는 중"}
              </span>
            </div>
            <div className="map-compass">N ↑</div>
          </div>
          <div className="map-bottom">
            <span className="legend">
              <i />
              렌즈 화각
            </span>
            <span className="legend sun">
              <i />
              태양 방위
            </span>
            <span className="legend moon">
              <i />달 방위
            </span>
          </div>
        </div>
        <div className="map-side">
          <div className="panel">
            <h3>촬영자 · 피사체</h3>
            <div className="dialog-actions">
              <button
                className="btn light"
                onClick={() => setDialog("observer")}
              >
                A 좌표 입력
              </button>
              <button
                className="btn light"
                onClick={() => setDialog("subject")}
              >
                B 좌표 입력
              </button>
            </div>
            <p>
              A 촬영자{" "}
              <span id="observerCoords">
                {state.observer.lat.toFixed(5)}, {state.observer.lng.toFixed(5)}
              </span>
            </p>
            <p>
              B 피사체{" "}
              <span id="subjectCoords">
                {state.subject.lat.toFixed(5)}, {state.subject.lng.toFixed(5)}
              </span>
            </p>
            <div className="dialog-actions">
              {(["observer", "subject"] as const).map((m) => (
                <button
                  className={`btn ${mode === m ? "primary" : "light"}`}
                  key={m}
                  onClick={() => setMode(m)}
                >
                  {m === "observer" ? "촬영자" : "피사체"} 옮기기
                </button>
              ))}
            </div>
            <div className="fov-number mono" id="mapBearing">
              {Math.round(bearing)}°
            </div>
            <p>{light}</p>
            <label>
              실제 초점거리 {state.gear.lens} mm
              <input
                id="mapLens"
                className="lens-range"
                type="range"
                min="16"
                max="200"
                value={state.gear.lens}
                onChange={(e) => setGear({ lens: Number(e.target.value) })}
              />
            </label>
            <div className="gear-stats">
              <div>
                <small>수평 화각</small>
                <b>{fov.toFixed(1)}°</b>
              </div>
              <div>
                <small>센서</small>
                <b>{sensors[state.gear.sensor].name}</b>
              </div>
            </div>
          </div>
          <div className="panel">
            <h3>방향과 빛을 구분하세요</h3>
            <p>
              카메라 → 피사체 선은 촬영 방향입니다. 방향선은 이동 경로가 아니며
              지형·건물 차폐는 반영하지 않습니다.
            </p>
            <button
              className="textlink"
              id="mapReset"
              onClick={() =>
                setState((s) => ({
                  ...s,
                  subject: destinationGeo(
                    s.observer,
                    recommendation.bearing,
                    225,
                  ),
                }))
              }
            >
              추천 방향으로 초기화 →
            </button>
            <a
              className="textlink"
              href={`https://www.google.com/maps/search/?api=1&query=${state.observer.lat},${state.observer.lng}`}
              target="_blank"
              rel="noreferrer"
            >
              Google 지도 열기 ↗
            </a>
          </div>
        </div>
      </div>
      {dialog && (
        <CoordinateDialog
          subject={dialog === "subject"}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
}
