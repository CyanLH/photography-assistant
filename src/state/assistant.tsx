"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { calculate, solarWindows } from "../domains/astronomy";
import {
  dayBounds,
  dateKey,
  locationTimezone,
  timeLabel,
} from "../domains/timing";
import {
  locate,
  validatePoint,
  type Point,
  type LocationSource,
} from "../domains/location";
import { fieldOfView } from "../domains/gear";
import { recommend } from "../domains/recommendation";
import {
  createPlan,
  restorePlan,
  initialState,
  parseGear,
  parsePlans,
  sensors,
  type Gear,
  type Plan,
} from "./model";
const GEAR_KEY = "photography-assistant-gear-v1",
  PLAN_KEY = "photography-assistant-plans-v1";
function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
function persist(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
function useAssistantState() {
  const [state, setState] = useState(initialState),
    [message, setMessage] = useState(""),
    [gpsBusy, setGpsBusy] = useState(false);
  const revision = useRef(0),
    alive = useRef(false);
  const notify = useCallback((text: string) => setMessage(text), []);
  useEffect(() => {
    alive.current = true;
    // Browser-only storage/current-time initialization keeps server and hydration output identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({
      ...s,
      ready: true,
      instant: Date.now(),
      gear: parseGear(read(GEAR_KEY)),
      plans: parsePlans(read(PLAN_KEY)),
    }));
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(id);
  }, [message]);
  useEffect(() => {
    if (!state.followNow) return;
    const id = setInterval(
      () => setState((s) => ({ ...s, instant: Date.now() })),
      30000,
    );
    return () => clearInterval(id);
  }, [state.followNow]);
  const setPoint = useCallback(
    (
      point: Point,
      source: LocationSource = "manual",
      accuracy: number | null = null,
      capturedAt: number | null = null,
    ) => {
      const valid = validatePoint(point),
        timezone = locationTimezone(valid);
      revision.current++;
      setState((s) => ({
        ...s,
        observer: valid,
        source,
        accuracy,
        capturedAt,
        timezone,
        timezoneSource: "좌표 추정",
      }));
    },
    [],
  );
  const requestGps = useCallback(async () => {
    if (!navigator.geolocation || !window.isSecureContext) {
      notify(
        "HTTPS 또는 localhost에서 위치를 사용할 수 있습니다. 좌표를 입력하세요.",
      );
      return;
    }
    const ticket = ++revision.current;
    setGpsBusy(true);
    try {
      const result = await locate(navigator.geolocation);
      if (alive.current && ticket === revision.current) {
        setPoint(result.point, "gps", result.accuracy, result.capturedAt);
        notify("기기 추정 위치를 적용했습니다.");
      }
    } catch (error) {
      if (alive.current && ticket === revision.current) {
        const code = (error as GeolocationPositionError).code;
        notify(
          code === 1
            ? "위치 권한이 거부되었습니다. 직접 좌표를 지정하세요."
            : code === 3
              ? "위치 요청 시간이 초과되었습니다. 좌표를 직접 지정하세요."
              : "위치를 확인하지 못했습니다. 좌표를 직접 지정하세요.",
        );
      }
    } finally {
      if (alive.current) setGpsBusy(false);
    }
  }, [notify, setPoint]);
  useEffect(() => {
    let active = true;
    navigator.permissions
      ?.query({ name: "geolocation" })
      .then((p) => {
        if (active && p.state === "granted") void requestGps();
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [requestGps]);
  const day = dateKey(new Date(state.instant), state.timezone);
  const bounds = useMemo(
    () => dayBounds(day, state.timezone),
    [day, state.timezone],
  );
  const minute = Math.floor((state.instant - bounds.start) / 60000);
  const sky = useMemo(
    () => calculate(new Date(state.instant), state.observer),
    [state.instant, state.observer],
  );
  const windows = useMemo(
    () => solarWindows(day, state.timezone, state.observer),
    [day, state.timezone, state.observer],
  );
  const sensor = sensors[state.gear.sensor];
  const fov = fieldOfView(
    sensor.w,
    sensor.h,
    state.gear.lens,
    state.gear.orientation,
  );
  const recommendation = recommend(sky, {
    ...state.gear,
    intent: state.intent,
  });
  const format = (m: number) =>
    timeLabel(
      new Date(bounds.start + Math.round(m) * 60000),
      state.timezone,
      bounds.minutes !== 1440,
    );
  const setMinute = (m: number) =>
    setState((s) => ({
      ...s,
      instant:
        bounds.start + Math.max(0, Math.min(bounds.minutes - 1, m)) * 60000,
      followNow: false,
    }));
  const setDate = (date: string) => {
    try {
      const next = dayBounds(date, state.timezone);
      setState((s) => ({
        ...s,
        instant: next.start + Math.min(minute, next.minutes - 1) * 60000,
        followNow: false,
      }));
    } catch (e) {
      notify((e as Error).message);
    }
  };
  const setTimezone = (zone: string) => {
    try {
      dateKey(new Date(state.instant), zone);
      setState((s) => ({
        ...s,
        timezone: zone,
        timezoneSource: "사용자 지정",
      }));
    } catch {
      notify("유효한 IANA 시간대를 입력하세요.");
    }
  };
  const setGear = (patch: Partial<Gear>) =>
    setState((s) => ({ ...s, gear: parseGear({ ...s.gear, ...patch }) }));
  const saveGear = () =>
    notify(
      persist(GEAR_KEY, state.gear)
        ? "장비 프로필을 이 브라우저에 저장했어요."
        : "저장이 차단되어 현재 화면에서만 적용했어요.",
    );
  const savePlan = (includeCoordinates: boolean) => {
    const plans = [
      ...state.plans,
      createPlan(state, includeCoordinates, crypto.randomUUID()),
    ].slice(-5);
    setState((s) => ({ ...s, plans }));
    notify(
      persist(PLAN_KEY, plans)
        ? `계획 저장 완료 · ${includeCoordinates ? "좌표 포함" : "좌표 제외"}`
        : "브라우저 저장이 차단되어 이번 화면에서만 유지해요.",
    );
  };
  const loadPlan = (plan: Plan) => {
    revision.current++;
    setState((s) => restorePlan(s, plan));
    notify("저장한 조건을 불러왔어요.");
  };
  const deletePlan = (id: string) => {
    const plans = state.plans.filter((p) => p.id !== id);
    setState((s) => ({ ...s, plans }));
    if (!persist(PLAN_KEY, plans))
      notify("영구 저장소에 접근할 수 없어 삭제를 완료하지 못했습니다.");
  };
  const clearStorage = () => {
    try {
      localStorage.removeItem(GEAR_KEY);
      localStorage.removeItem(PLAN_KEY);
      setState((s) => ({ ...s, plans: [] }));
      notify("저장된 장비와 계획을 지웠어요. 현재 입력은 유지돼요.");
    } catch {
      notify("저장소에 접근할 수 없어 삭제하지 못했습니다.");
    }
  };
  return {
    state,
    setState,
    sky,
    windows,
    day,
    bounds,
    minute,
    format,
    fov,
    recommendation,
    setPoint,
    setMinute,
    setDate,
    setTimezone,
    setGear,
    saveGear,
    savePlan,
    loadPlan,
    deletePlan,
    clearStorage,
    requestGps,
    gpsBusy,
    notify,
    message,
  };
}
type Assistant = ReturnType<typeof useAssistantState>;
const Context = createContext<Assistant | null>(null);
export function AssistantProvider({ children }: { children: ReactNode }) {
  return (
    <Context.Provider value={useAssistantState()}>{children}</Context.Provider>
  );
}
export function useAssistant() {
  const value = useContext(Context);
  if (!value) throw new Error("AssistantProvider missing");
  return value;
}
