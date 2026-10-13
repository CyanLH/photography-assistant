# Codex implementation prompt | Photography Assistant

Copy the following prompt into Codex with this package mounted in your project directory. Treat `prototype/index.html` as the current functional reference, not just a mockup. Review existing repository conventions before changing code.

---

Build/update a mobile-first **Photography Assistant** web app for mirrorless camera users. The phone is an auxiliary location-and-heading aid; capture happens on a mirrorless camera. Do not add any branding logos, alternate names or marketing taglines.

## UI constraints

- Use the visible product name **Photography Assistant** (correct spelling). No previous Korean product name or aperture/compass logomark.
- Page titles are exactly **현장 가이드**, **빛 지도**, **시간 계획**, **내 장비**. Remove decorative poetic subheadings/descriptions on all four views.
- Keep the enlarged content area, narrow desktop 90px navigation rail, thin 53px desktop header / 51px mobile header, and mobile-first wide map/compass.
- Treat the screenshots as layout references but do not copy simulated weather values as live data.

## Real location and ephemeris

- Get current device location using `navigator.geolocation.getCurrentPosition` only after a user action or if permission was already granted; request high accuracy, record `coords.accuracy`, handle denial/timeouts, and allow manual lat/lon. Geolocation is an estimate; never claim GPS-only precision.
- Calculate solar and lunar altitude and true-north clockwise azimuth **from the selected real coordinates and UTC instant**, not from canned numbers. The supplied `reference/astro-engine.mjs` provides a dependency-free approximate ephemeris to compare with; use a pinned well-supported astronomy package if appropriate and verify units/conventions against independent fixtures.
- Show **lunar phase** as a correctly illuminated disk diagram plus waxing/waning/quarter/full label and percent illumination. Do not simply show a generic crescent icon. Disclose if disk rotation is schematic rather than a real-sky orientation.
- Compute local dawn and evening **golden-hour** solar elevation -4°..+6° and **blue-hour** -6°..-4°, plus sunrise/sunset. Handle locations/seasons with no crossings by displaying '해당 날짜에 없음'. Do not hard-code time window lengths or Seoul sunrise/sunset.
- Use selected location's IANA timezone in production, including DST / international date line; the standalone HTML currently labels **device timezone** until a geotimezone adapter is added. Keep UTC as internal instant, not naïve HH:mm.
- Updating GPS/manual location, date/time, or map observer A pin must immediately update solar/lunar bearings, altitudes, disk, windows, compass lines, chart and recommendation.
- A moon below the horizon must be labeled unavailable for direct moon photos. A sun below the horizon cannot drive direct sunlight recommendations. Do not infer building/terrain/cloud blockage from orbital calculations.

## Maps, weather and sensors

- Google Maps JavaScript API is the only tile/basemap provider. Provide Maps JS API + Map ID with restricted browser key (HTTP referrer + Maps JavaScript API), marker A observer and B subject, bearing, sensor-based FOV polygon, accurate sun/moon rays. Preserve Google attribution. No key -> truthful fallback schematic / coordinate input.
- Weather is currently **demo data** and must be clearly labeled. Implement a live weather provider only with correct licensing/terms, timestamps, cloud-layer nulls, server-side proxy if needed and explicit error states; do not silently blend sample weather into live astronomy.
- Device orientation remains **manual demo**. Do not use `coords.heading` as phone/camera heading. iOS permission, true north vs magnetic north and sensor accuracy need real-device checks.
- Keep mirrorless sensor/focal length/FOV, tripod, exposure caveats and local plans. Saving precise location must be opt-in with transparent deletion.

## Implementation approach

1. Inspect this package's README, PRD, SCREEN_SPEC, prototype, astronomy module/tests, geometry tests and existing repository rules.
2. Build isolated typed astronomy, location, timing, recommendation, Google Maps, weather and gear domains; pin dependencies.
3. Connect actual browser GPS and astronomy first; prove changes in both coordinates and time cause changed computed data. Implement moon phase diagram, thresholds and polar no-event paths.
4. Keep Google Maps + manual fallback, compute/label source status, then integrate weather data independently with source/time labels.
5. Add unit tests for azimuth conventions, sunrise/sunset and golden/blue threshold roots, polar days, DST boundaries, moon phases, location denial and user/manual/Google pin paths. Run mobile/desktop E2E, typecheck, lint, build.
6. Produce `docs/IMPLEMENTATION_LOG.md` listing commands, actual successes, mocked vs live vs pending. Do not claim that mock Maps tests validate real Google tile loading or physical GPS.

Do not deploy, buy APIs, push remote commits or overwrite unrelated work without asking.
