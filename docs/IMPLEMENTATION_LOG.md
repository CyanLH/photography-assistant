# Photography Assistant implementation log

## Next.js migration — current application

Completed locally on 2026-10-12 (Asia/Seoul). The sections below this migration entry describe the preserved standalone prototype; their implementation details and counts are historical.

### Architecture and preserved behavior

- Next.js **16.4.0**, React/React DOM **19.3.0**, App Router, strict TypeScript React components. Dependencies are exact versions in package-lock.json. Node **22.13+ or 24 LTS** is required for the complete toolchain; final typecheck/lint/build use the bundled Node **24.19.0**. The host's Node 22.11 could run Next but produced a development-tool engine warning during install.
- Routes `/`, `/map`, `/planner`, `/gear` expose 현장 가이드, 빛 지도, 시간 계획, 내 장비. Shared state lives in the root provider and survives Next Link navigation and browser Back. Browser APIs, localStorage and current time initialize only after mounting; server and initial client output match.
- Replaced global DOM manipulation with React-owned view components, dialogs, controls, SVG compass/chart/gear previews and shared state. The Next app does not inject the old HTML or run its script. It imports the existing calculation domains. Existing 90px rail, 53/51px headers, colors and wide mobile map/compass styling are retained.
- Preserved consent/accuracy/error/stale-response location behavior; UTC/IANA/DST date and timeline calculations; moon disk and below-horizon semantics; lens/sensor/portrait FOV; gear and optional-coordinate plan persistence. Valid v1 UTC plans and equipment are read with validation. Header quick-save excludes coordinates; planner consent is explicit. Pure persistence tests cover old records and malformed data.
- Google Maps uses `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, requiring both. The map page lazy-loads the API; effects clean up markers, listeners and shapes on route exit. Missing configuration/network failure keeps the schematic. Key restrictions, real tiles, physical GPS and device orientation remain externally unvalidated.
- Weather remains separate fixture data, and orientation remains manual. No deployment, API purchase, secret insertion or remote Git action. `prototype/index.html` and its sources remain a reference; `npm run build` now builds Next.js, while `npm run build:prototype` is an explicit separate command.

### Verification and evidence

- `npm run typecheck`, `npm run lint`, `npm run format:check`: passed. Lint now uses Next core-web-vitals and TypeScript rules. One narrowly documented initialization exception loads browser-only state after hydration; hooks rules otherwise remain enabled.
- `npm test`: **41/41 passed** (39 existing/reference/domain tests plus two persistence suites). Includes `node --test reference/*.test.mjs` through the combined command.
- `npm run build`: successful optimized App Router build with four page routes. Final build also verified using Node 24.19.0. `next start` serves the actual production build, not static HTML routed through a test stub.
- `node qa/next-browser.mjs`: **58/58 passed**, real HTTP server at 360×800, 390×844, 768×1024 and 1440×1080. Checks direct route responses, overflow, hydration/runtime errors, no unconsented GPS, device-independent timezone, state preservation during Next navigation/Back, DST repeated hours, persistence/restore, consent, permission denial, accuracy, late GPS race, polar paths and blocked storage.
- `NEXT_BUILD_DIR=.next-maps NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TEST_KEY_ONLY NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=TEST_MAP_ID npm run build`, then a separate `next start` on port 8081 and `TEST_URL=http://127.0.0.1:8081 node qa/next-browser.mjs --maps`: **8/8 passed**. Mock markers/overlays, observer click/drag, timezone propagation, subject bearing, cleanup on route exit, remount and network-failure schematic. The fake key is only used by the separate test output; final normal build has no test key.
- Current evidence: `qa/current/next-ui.log`, `qa/current/next-maps.log`, `qa/current/next-build.log`, `qa/current/next-unit.log`, `qa/current/next/ui.json`, `qa/current/next/maps.json`, and screenshots in `qa/current/next/`. Original screenshot references were not overwritten. Mobile field/map and desktop planner screenshots were visually inspected; planner control contrast and link decoration were corrected.
- `npm audit --omit=dev`: **0 production vulnerabilities**. Full install reports five development-only findings through eslint-config-next → fast-glob → micromatch → braces. npm proposes a major downgrade of Next lint tooling rather than a compatible patch; that downgrade was not applied. No runtime vulnerability-free claim beyond the production audit at this date.
- Failures and repairs: first server startup found the prior project's static server occupying 8080; its command/cwd were verified before replacement. Initial E2E caught a missing favicon, then Next's generated metadata handler rejected an empty 204 response; a transparent image response fixed both without introducing branding. The final reruns passed. A temporary approval-review credit failure blocked a package lookup; after the user's request to continue, approved operations resumed. These failed runs are not counted as successful checks.

Documentation consulted: [Next installation](https://nextjs.org/docs/app/getting-started/installation) and [Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components). Installed package types and production builds confirmed configuration/API compatibility.


Date: 2026-10-12 (Asia/Seoul). Local implementation only; no deployment, API purchase, remote push or commit.

## Implementation

Read README, AGENTS, PRD, SCREEN_SPEC, CODEX_PROMPT, the supplied DOCX text, screenshot references, inline prototype, astronomy/geometry modules and existing QA. This directory has no Git metadata. The original screenshot assets and DOCX were not modified.

The existing responsive UI is retained in `src/index.html` and `src/ui.js`. Strict TypeScript domains in `src/domains` isolate astronomy, location, timing, recommendations, Google Maps geometry, weather and gear. UI orchestration remains JavaScript; typecheck covers the domain modules, not a fully typed UI migration. `npm run build` bundles the domains and creates both `dist/index.html` and a self-contained `prototype/index.html`. Edit source files; generated HTML is overwritten by the build.

- The reference ephemeris is now shared with the app rather than copied into a second inline implementation. Degrees are clockwise from true north; positions remain approximate, including refraction. Sunrise/sunset retain the package's apparent solar-center 0° convention, not standard upper-limb almanac times.
- Coordinates resolve to an IANA zone with pinned `@photostructure/tz-lookup` 11.7.0. This is a compressed, approximate geographical lookup, explicitly labeled as an estimate. A user can correct the zone. UTC offsets/DST come from the browser's Intl timezone database. Political boundary/zone changes require dependency and browser updates.
- Date selection and all computations use UTC instants within the selected civil day's actual bounds. Sliders span 23/24/25 hours; repeated DST times include the GMT offset. Nonexistent dates are rejected. Polar missing crossings remain null and show 해당 날짜에 없음.
- GPS is requested on a click or an already-granted permission. High accuracy, accuracy radius, timeout/denial handling and capture timestamp are preserved. A pending GPS response cannot overwrite a newer manual/map selection. Movement heading never sets camera heading.
- A observer pin changes recalculate timezone, sky, windows, chart and recommendations. B subject pin controls framing independently. Both pins have keyboard-accessible coordinate entry. Schematic observer clicks open coordinate entry instead of inventing a geographic position.
- Below-horizon direct-light advice is disabled. Night/morning twilight no longer always claims “after sunset” or western glow. Moon phase includes illuminated geometry and an explicit schematic-rotation limitation.
- Plan saving excludes precise coordinates by default. Explicit checkbox consent includes coordinates; restore uses the saved UTC instant, gear, intent and optionally location/zone. Plans without coordinates use the current location. Per-plan and all-data deletion remain available. Invalid stored dates/zones/coordinates are filtered.
- Weather remains a separate fixture domain with explicit source, absent timestamps and null cloud layers. No live weather API or server credentials have been introduced.
- Google Maps remains the only basemap provider. Missing keys/network errors preserve the labeled schematic; real integration requires a restricted browser key and Map ID. The loader has a timeout and error state. Google attribution space is retained; actual tiles still need a live visual check.

## Verification

- `npm install --ignore-scripts`: pinned dependencies and lockfile installed; npm audit reported 0 vulnerabilities at installation. Initial sandbox registry access required network escalation.
- `npm run typecheck`: passed, strict domain TypeScript.
- `npm run lint`: passed, ESLint correctness rules on application JavaScript, scripts and tests. TypeScript correctness uses tsc.
- `npm test`: passed, 39 tests: 32 existing reference tests + 7 domain suites. Includes all solar threshold roots, polar summer/winter, DST spring/fall, skipped dates, date line, lunar disk area, high-accuracy location/failure paths, weather null versus zero, gear and bearing geometry.
- Independent numerical comparison: Astronomy Engine 2.1.19 at three date/location fixtures (Seoul, New York, Sydney), sun position within 1°, moon within 3°, illuminated fraction within 0.025. These are regression tolerances for this approximate engine, not a universal accuracy guarantee. This is separate from comparing the app to its own shared reference module.
- Browser commands/results are recorded in `qa/current/ui.log`, `qa/current/maps.log` and JSON reports. Screenshots use `qa/current/` so original layout references are preserved. Bundled Playwright 1.62.1 controls installed headless Google Chrome. Override `PLAYWRIGHT_MODULE` and `BROWSER_CHANNEL` on another host.
- First lint attempt preceded test-file creation and failed on the missing tests directory; subsequent lint passed. First browser launch and localhost access were sandbox-blocked; approved local execution succeeded. First Maps mock contained a syntax error; it was moved to `qa/google-mock.js`, syntax-checked, and rerun successfully. No failure was counted as a pass.

## Live versus simulated and remaining checks

Live in browser: local astronomical calculations from selected coordinates/time; Intl timezone calculations; browser geolocation API wiring. Automated geolocation tests inject results/errors and do not establish physical location accuracy.

Mocked: Google Maps loader/classes/markers/shapes and browser geolocation. Mock tests validate integration behavior, not Google tiles, attribution rendering, credentials, billing, GPS hardware or compass sensors.

Intentionally demo: weather values, manual orientation. Live weather needs a licensed provider decision, source/retrieval timestamps, null-preserving server route and independent failure tests. This implementation makes no live-weather claim.

Pending external validation: real restricted Google Maps key/Map ID, real tile and attribution display, physical iOS/Android geolocation/sensor checks, timezone-border correctness for target deployment locations, broader ephemeris validation and outdoor readability. No production-readiness or real-device validation claim.

## Final browser results

- `python3 qa/verify_ui.py`: **63/63 passed** at 360×800, 390×844, 768×1024 and 1440×1080. Four-view navigation/overflow, runtime errors, date/time/coordinate updates, DST day length, phase disclosure, consent/default coordinate exclusion, UTC restoration, empty coordinates, focus return, denial/accuracy/stale GPS response, polar null events, blocked storage and deletion were exercised.
- `python3 qa/verify_maps_mock.py`: **6/6 passed**. Two markers plus FOV/celestial overlays, observer click and drag across timezones, subject bearing, no runtime errors, network-error schematic fallback. Real Google tile rendering remains untested.
- `node --test reference/*.test.mjs`: **32/32 passed** separately; included in the 39-test combined run, not an additional 32 distinct tests.
- Visually inspected current mobile field/planner/map screenshots and desktop planner screenshot. New controls fit within the retained layout; scrolling remains necessary for the planner and equipment panels. Original supplied screenshot files were preserved.

Independent comparison documentation: [Astronomy Engine](https://github.com/cosinekitty/astronomy). Timezone adapter and its accuracy limitations: [PhotoStructure tz-lookup](https://github.com/photostructure/tz-lookup). Package versions are pinned in `package-lock.json`.

Final migration verification rerun: normal production build contains no mock key; final UI suite again passed 58/58 after contrast/link styling and rounded event-time display changes. Test servers on 8080/8081 were stopped after verification. Start the app with `npm run dev` (or `npm run start` for the completed production build).

## Initial Git commit review — 2026-10-14

The repository had no commits. Reviewed the Next.js routes, shared state/persistence, Google Maps integration, package/configuration and existing verification records. Removed a temporary Maps configuration console log and normalized its formatting. Excluded local .env, IDE and OS files; added a blank .env.example without changing local configuration.

Re-ran TypeScript, Next/TypeScript lint, formatting checks and all 41 unit tests successfully. The first formatting check found map-view.tsx formatting and passed after correction. Existing 58 UI and 8 mocked Maps check results are from the migration verification, not new browser runs on this date. No functional change requiring a new browser/build run was introduced during commit preparation. Original documents, reference screenshots and standalone prototype are included as project reference assets; generated build outputs and current QA artifacts are excluded.

## Mobile Google Maps visibility fix — 2026-10-14

- Reproduced the missing mobile map with a browser regression assertion: after the schematic SVG unmounted, the column flex layout's `align-items: start` left the absolutely positioned Google map inside a collapsed-width wrapper.
- Set the map wrapper to `width: 100%; min-width: 0` and applied the existing `maps-loading` class so Google initializes in a visible, sized container.
- Added map dimensions/overflow assertions at 360×800, 390×844, 844×390, and 1440×1080, plus constructor-time dimensions. The first new assertion failed before the fix; all 17 Maps checks passed afterward using `TEST_URL=http://127.0.0.1:8081 node qa/next-browser.mjs --maps` with dummy credentials and intercepted Google script.
- `npm run typecheck`, `npm run lint`, `npm run format:check`: passed. `node --test reference/*.test.mjs`: 32/32 passed.
- This validates browser layout and mocked Maps integration, not actual Google tile loading or physical mobile WebViews.
- `npm run build` with bundled Node 24: passed (all App Router pages generated).
