# Photography Assistant | repository notes

- Read docs/PRD.md, docs/SCREEN_SPEC.md, docs/CODEX_PROMPT.md before changes.
- Mirrorless camera users are primary. The phone helps find location and heading; it does not control the camera.
- Show page names only: 현장 가이드, 빛 지도, 시간 계획, 내 장비. Use text product name Photography Assistant only. No logo, tagline or poetic introduction.
- Calculated astronomical data and fixture weather are separate. Never silently replace missing GPS, sun, moon or weather data with mock data.
- The self-contained prototype performs local ephemeris calculations in JS (`reference/astro-engine.mjs` mirrors inline algorithms), and real browser geolocation only after consent. The first coordinate is a clearly labeled example, never presented as actual current GPS.
- Golden hour thresholds: solar apparent altitude -4 through +6 degrees; blue hour: -6 through -4. Handle polar none cases. Always indicate timezone source and calculated/approximate status.
- Moon phase must show illumination fraction, named phase and an illuminated disk diagram, without claiming that the diagram matches sky rotation.
- Map provider: Google Maps JavaScript API only, with referrer- and API-restricted browser key. Do not hide Google logos/attribution. Never put server secrets in browser code.
- GPS coords.heading indicates movement direction, not camera or phone facing direction. Do not pretend to know mirrorless orientation. Compass remains a labeled manual demo until validated.
- In production, use an IANA timezone for the selected GPS/manual location; the HTML prototype currently displays device timezone. Handle DST and event-less polar days.
- Weather UI in HTML remains a demo. Use a server-side route for weather when implementing live data, preserving missing/null and source timestamps.
- Run `node --test reference/*.test.mjs`, browser UI checks and mock Google Maps integration. Record genuine verification only. Real devices, real Google tiles and weather integration are not validated by mocks.
- Do not deploy, buy paid APIs, push commits, or overwrite unrelated files without authorization.
