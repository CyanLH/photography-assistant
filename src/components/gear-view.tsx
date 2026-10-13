"use client";
import { useAssistant } from "../state/assistant";
import { sensors, type Gear } from "../state/model";
export function GearView() {
  const { state, setGear, fov, saveGear, clearStorage } = useAssistant(),
    g = state.gear,
    sensor = sensors[g.sensor],
    width = Math.min(285, Math.max(34, fov * 4)),
    height =
      g.orientation === "portrait"
        ? Math.min(145, width * 1.5)
        : (width * 2) / 3;
  return (
    <section className="view active" id="view-gear" aria-label="내 장비">
      <div className="pagehead">
        <h1>내 장비</h1>
        <span className="pill green">미러리스 기본 프로필</span>
      </div>
      <div className="gear-layout">
        <div className="form-card">
          <h3>촬영 장비</h3>
          <div className="form-row">
            <label htmlFor="cameraName">카메라 이름 · 선택</label>
            <input
              id="cameraName"
              maxLength={40}
              value={g.name}
              onChange={(e) => setGear({ name: e.target.value })}
            />
            <p>모델 검색 없이 직접 입력할 수 있어요.</p>
          </div>
          <div className="form-row">
            <label htmlFor="sensorSelect">센서 크기</label>
            <select
              id="sensorSelect"
              value={g.sensor}
              onChange={(e) =>
                setGear({ sensor: e.target.value as Gear["sensor"] })
              }
            >
              {Object.entries(sensors).map(([id, s]) => (
                <option key={id} value={id}>
                  {s.name} · {s.w} × {s.h} mm
                </option>
              ))}
            </select>
            <p>대표적인 센서 규격입니다. 실제 모델과 차이가 있을 수 있어요.</p>
          </div>
          <div className="form-row">
            <label htmlFor="gearLens">
              현재 렌즈 초점거리 <span className="mono">{g.lens} mm</span>
            </label>
            <input
              className="lens-range"
              id="gearLens"
              type="range"
              min="16"
              max="200"
              value={g.lens}
              onChange={(e) => setGear({ lens: Number(e.target.value) })}
            />
            <div className="lens-pills">
              {[24, 35, 55, 85, 135, 200].map((n) => (
                <button
                  key={n}
                  className={g.lens === n ? "selected" : ""}
                  onClick={() => setGear({ lens: n })}
                >
                  {n} mm
                </button>
              ))}
            </div>
            <p>35mm 환산값이 아닌 렌즈의 실제 초점거리입니다.</p>
          </div>
          <div className="form-split">
            <div className="form-row">
              <label htmlFor="apertureSelect">최대 개방 조리개</label>
              <select
                id="apertureSelect"
                value={g.aperture}
                onChange={(e) => setGear({ aperture: Number(e.target.value) })}
              >
                {[1.8, 2.8, 4, 5.6, 8].map((n) => (
                  <option key={n} value={n}>
                    F{n}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label htmlFor="orientationSelect">프레임 방향</label>
              <select
                id="orientationSelect"
                value={g.orientation}
                onChange={(e) =>
                  setGear({
                    orientation: e.target.value as Gear["orientation"],
                  })
                }
              >
                <option value="landscape">가로 촬영</option>
                <option value="portrait">세로 촬영</option>
              </select>
            </div>
          </div>
          <div className="switch-row">
            <div>
              삼각대 사용<small>긴 셔터를 제안할지 판단하는 기준이에요.</small>
            </div>
            <button
              className={`switch ${g.tripod ? "on" : ""}`}
              id="tripodSwitch"
              role="switch"
              aria-checked={g.tripod}
              aria-label="삼각대 사용"
              onClick={() => setGear({ tripod: !g.tripod })}
            />
          </div>
          <button
            id="saveGear"
            className="btn primary full"
            style={{ marginTop: 24 }}
            onClick={saveGear}
          >
            이 장비 저장하기
          </button>
        </div>
        <div>
          <div className="panel">
            <div className="between">
              <h3>내 렌즈의 프레임</h3>
              <span className="pill gray">{g.lens} mm</span>
            </div>
            <div className="frame-preview">
              <svg
                viewBox="0 0 360 210"
                role="img"
                aria-label="센서와 초점거리에 따른 시야 도식"
              >
                <rect width="360" height="210" fill="#20372e" />
                <path
                  d="M0 152 54 107 88 132 133 75 192 148 236 103 289 154 328 112 360 150V210H0Z"
                  fill="#3d5940"
                />
                <circle cx="248" cy="65" r="13" fill="#e8bd6a" />
                <rect
                  x={180 - width / 2}
                  y={105 - height / 2}
                  width={width}
                  height={height}
                  fill="none"
                  stroke="#e8e5c5"
                />
              </svg>
              <span className="frame-label">
                구도 설명용 도식 · 실제 피사체 아님
              </span>
            </div>
            <div id="gearFov" className="fov-number mono">
              {fov.toFixed(1)}°
            </div>
            <p>수평 화각 · 현재 센서와 프레임 방향 기준</p>
            <div className="gear-stats">
              <div>
                <small>35mm 환산 초점거리</small>
                <b>
                  {Math.round(
                    (g.lens * Math.hypot(36, 24)) /
                      Math.hypot(sensor.w, sensor.h),
                  )}{" "}
                  mm
                </b>
              </div>
              <div>
                <small>촬영 지지</small>
                <b>{g.tripod ? "삼각대" : "핸드헬드"}</b>
              </div>
            </div>
            <p className="gear-disclaimer">
              화각은 직선 투영 렌즈의 기하적 근사이며 렌즈 왜곡·포커스
              브리딩·디지털 크롭은 포함하지 않습니다.
            </p>
          </div>
          <div className="info-strip" style={{ marginTop: 18 }}>
            장비·계획은 이 브라우저에 저장합니다. 위치 권한은 현재 위치 사용을
            누르거나 이미 허용된 경우에만 요청합니다. 카메라는 제어하지
            않습니다.
          </div>
          <button className="textlink" id="resetLocal" onClick={clearStorage}>
            저장 데이터 지우기
          </button>
        </div>
      </div>
    </section>
  );
}
