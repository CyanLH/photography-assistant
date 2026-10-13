/** Proposed domain contracts. Calculated astronomy uses sourceMode="calculated"; demo weather uses "fixture". */
export type SourceMode = 'fixture' | 'calculated' | 'live' | 'cached' | 'unavailable';
export type Intent = 'sunset' | 'landscape' | 'portrait' | 'moon';
export type Heading = {
  deg: number | null;
  reference: 'true-north' | 'magnetic-north' | 'unknown';
  source: 'absolute-orientation' | 'webkit-compass' | 'manual' | 'unavailable';
  accuracyDeg: number | null;
  capturedAt: number | null;
};
export type Location = {
  lat: number; lon: number; accuracyM: number | null;
  source: 'device' | 'manual'; capturedAt: number;
  timezone: string;
};
export type CameraProfile = {
  id: string; name?: string;
  sensorWidthMm: number; sensorHeightMm: number;
  focalLengthMm: number; maxOpeningFNumber: number;
  orientation: 'landscape' | 'portrait';
  tripod: boolean; subjectMotion: 'static' | 'slow' | 'fast';
};
export type CelestialState = {
  azimuthTrueDeg: number; altitudeDeg: number;
  altitudeConvention: 'apparent' | 'geometric';
  validAt: number; sourceMode: SourceMode; adapterVersion: string;
};
export type Astronomy = {
  sun: CelestialState;
  moon: CelestialState & {illuminatedFraction: number; phase: number; distanceKm: number};
  events: {sunrise: number | null; sunset: number | null; moonrise: number | null; moonset: number | null};
};
export type Weather = {
  temperatureC: number | null;
  cloudTotalPct: number | null; cloudLowPct: number | null;
  cloudMidPct: number | null; cloudHighPct: number | null;
  precipProbabilityPct: number | null; precipMm: number | null;
  windMps: number | null; gustMps: number | null; visibilityM: number | null;
  validAt: number; retrievedAt: number; modelRunAt: number | null;
  timezone: string; source: string; sourceMode: SourceMode;
};
export type Recommendation = {
  id: string; intent: Intent;
  directionDeg: number | null;
  directionRangeDeg: {start: number; end: number; wrapsNorth: boolean} | null;
  altitudeDeg?: number;
  lightType: 'backlight' | 'frontlight' | 'sidelight' | 'twilight' | 'diffuse' | 'moon';
  suitability: 'recommended' | 'conditional' | 'deferred';
  reasons: string[]; caveats: string[]; gearAdvice: string[];
  dataQuality: 'sufficient' | 'partial' | 'stale';
  sourceTimes: {astronomyAt: number; weatherValidAt: number | null; weatherRetrievedAt: number | null};
  sourceMode: SourceMode; ruleVersion: string;
};
