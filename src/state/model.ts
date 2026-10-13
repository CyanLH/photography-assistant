import {
  validatePoint,
  type Point,
  type LocationSource,
} from "../domains/location";
import { dateKey } from "../domains/timing";
export const sensors = {
  ff: { name: "풀프레임", w: 36, h: 24 },
  aps: { name: "APS-C", w: 23.5, h: 15.6 },
  canon: { name: "Canon APS-C", w: 22.3, h: 14.9 },
  mft: { name: "MFT", w: 17.3, h: 13 },
};
export const intents = [
  ["sunset", "노을", "sunset"],
  ["landscape", "풍경", "landscape"],
  ["portrait", "인물", "person"],
  ["moon", "달", "moon"],
] as const;
export type Intent = (typeof intents)[number][0];
export type Gear = {
  name: string;
  sensor: keyof typeof sensors;
  lens: number;
  aperture: number;
  orientation: "landscape" | "portrait";
  tripod: boolean;
};
export type Plan = Gear & {
  id: string;
  instant: string;
  timezone: string;
  intent: Intent;
  lat?: number;
  lng?: number;
};
export type State = {
  ready: boolean;
  instant: number;
  timezone: string;
  timezoneSource: string;
  observer: Point;
  subject: Point;
  source: LocationSource;
  accuracy: number | null;
  capturedAt: number | null;
  followNow: boolean;
  intent: Intent;
  heading: number;
  gear: Gear;
  cloudy: boolean;
  plans: Plan[];
};
export const defaultGear: Gear = {
  name: "나의 미러리스",
  sensor: "ff",
  lens: 35,
  aperture: 2.8,
  orientation: "landscape",
  tripod: false,
};
export const initialState: State = {
  ready: false,
  instant: 0,
  timezone: "Asia/Seoul",
  timezoneSource: "좌표 추정",
  observer: { lat: 37.5664, lng: 127.0095 },
  subject: { lat: 37.56598, lng: 127.00741 },
  source: "sample",
  accuracy: null,
  capturedAt: null,
  followNow: true,
  intent: "sunset",
  heading: 230,
  gear: defaultGear,
  cloudy: false,
  plans: [],
};
export function parseGear(value: unknown): Gear {
  const g = (value && typeof value === "object" ? value : {}) as Partial<Gear>;
  return {
    name: typeof g.name === "string" ? g.name.slice(0, 40) : defaultGear.name,
    sensor: g.sensor && Object.hasOwn(sensors, g.sensor) ? g.sensor : "ff",
    lens:
      typeof g.lens === "number" && Number.isFinite(g.lens)
        ? Math.max(16, Math.min(200, g.lens))
        : 35,
    aperture:
      g.aperture && [1.8, 2.8, 4, 5.6, 8].includes(g.aperture)
        ? g.aperture
        : 2.8,
    orientation: g.orientation === "portrait" ? "portrait" : "landscape",
    tripod: g.tripod === true,
  };
}
export function parsePlans(value: unknown): Plan[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((v, index) => {
      try {
        if (
          !v ||
          typeof v.instant !== "string" ||
          !Number.isFinite(Date.parse(v.instant)) ||
          typeof v.timezone !== "string" ||
          !intents.some((i) => i[0] === v.intent)
        )
          return [];
        dateKey(new Date(v.instant), v.timezone);
        const coordinate =
          "lat" in v || "lng" in v
            ? validatePoint({ lat: v.lat, lng: v.lng })
            : null;
        return [
          {
            ...parseGear(v),
            id: typeof v.id === "string" ? v.id : `legacy-${index}`,
            instant: v.instant,
            timezone: v.timezone,
            intent: v.intent,
            ...(coordinate ? { lat: coordinate.lat, lng: coordinate.lng } : {}),
          },
        ];
      } catch {
        return [];
      }
    })
    .slice(-5);
}
export function createPlan(
  state: State,
  includeCoordinates: boolean,
  id: string,
): Plan {
  return {
    ...state.gear,
    id,
    instant: new Date(state.instant).toISOString(),
    timezone: state.timezone,
    intent: state.intent,
    ...(includeCoordinates
      ? { lat: state.observer.lat, lng: state.observer.lng }
      : {}),
  };
}
export function restorePlan(state: State, plan: Plan): State {
  return {
    ...state,
    instant: Date.parse(plan.instant),
    followNow: false,
    gear: parseGear(plan),
    intent: plan.intent,
    ...(plan.lat !== undefined && plan.lng !== undefined
      ? {
          observer: { lat: plan.lat, lng: plan.lng },
          timezone: plan.timezone,
          timezoneSource: "저장된 시간대",
          source: "manual" as const,
          accuracy: null,
          capturedAt: null,
        }
      : {}),
  };
}
