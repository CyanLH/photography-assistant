/**
 * Photography Assistant geometry reference. Not an astronomy or weather implementation.
 * Canonical angles: degrees clockwise from true north, [0, 360).
 */
function finite(value, name) {
  if (!Number.isFinite(value)) throw new TypeError(`${name} must be finite`);
  return value;
}
export function normalize360(deg) {
  finite(deg, 'angle');
  return ((deg % 360) + 360) % 360;
}
export function signedAngularDelta(targetDeg, currentDeg) {
  return ((normalize360(targetDeg) - normalize360(currentDeg) + 540) % 360) - 180;
}
export function angularDistance(a, b) {
  return Math.abs(signedAngularDelta(a, b));
}
export function turnInstruction(targetDeg, currentDeg, toleranceDeg = 3) {
  finite(toleranceDeg, 'toleranceDeg');
  if (toleranceDeg < 0 || toleranceDeg >= 180) throw new RangeError('Invalid tolerance');
  const delta = signedAngularDelta(targetDeg, currentDeg);
  if (Math.abs(delta) <= toleranceDeg) return {direction: 'aligned', degrees: Math.abs(delta)};
  if (Math.abs(delta) === 180) return {direction: 'opposite', degrees: 180};
  return {direction: delta > 0 ? 'right' : 'left', degrees: Math.abs(delta)};
}
export function fieldOfViewDeg(sensorWidthMm, sensorHeightMm, focalLengthMm, orientation = 'landscape') {
  for (const [name, value] of Object.entries({sensorWidthMm, sensorHeightMm, focalLengthMm})) {
    finite(value, name);
    if (value <= 0) throw new RangeError(`${name} must be positive`);
  }
  if (!['landscape', 'portrait'].includes(orientation)) throw new RangeError('Invalid orientation');
  const width = orientation === 'portrait' ? sensorHeightMm : sensorWidthMm;
  return 2 * Math.atan(width / (2 * focalLengthMm)) * 180 / Math.PI;
}
export function equivalentFocalLengthMm(sensorWidthMm, sensorHeightMm, focalLengthMm) {
  fieldOfViewDeg(sensorWidthMm, sensorHeightMm, focalLengthMm);
  return focalLengthMm * Math.hypot(36, 24) / Math.hypot(sensorWidthMm, sensorHeightMm);
}
/** Geometric candidates only; eligibility requires altitude/weather checks separately. */
export function candidateBearings(sunAzimuthDeg, moonAzimuthDeg) {
  const sun = normalize360(sunAzimuthDeg);
  const moon = normalize360(moonAzimuthDeg);
  return {backlight: sun, frontlight: normalize360(sun + 180),
    sidelight: [normalize360(sun + 90), normalize360(sun - 90)], moon};
}
export function feasibleAperture(preferredFNumber, maxOpeningFNumber) {
  finite(preferredFNumber, 'preferredFNumber');
  finite(maxOpeningFNumber, 'maxOpeningFNumber');
  if (preferredFNumber <= 0 || maxOpeningFNumber <= 0) throw new RangeError('F-numbers must be positive');
  return Math.max(preferredFNumber, maxOpeningFNumber);
}
/** Rectilinear projection, object centered; approximate apparent lunar diameter supplied by caller. */
export function centeredObjectFrameWidthFraction(angularDiameterDeg, sensorWidthMm, focalLengthMm) {
  finite(angularDiameterDeg, 'angularDiameterDeg');
  if (angularDiameterDeg <= 0 || angularDiameterDeg >= 180) throw new RangeError('Invalid angular diameter');
  fieldOfViewDeg(sensorWidthMm, sensorWidthMm, focalLengthMm);
  return 2 * focalLengthMm * Math.tan(angularDiameterDeg * Math.PI / 360) / sensorWidthMm;
}
