# Photography Assistant

Mobile-first Next.js app for mirrorless-camera photography planning. The phone supplies an estimated location and a manual heading aid; it does not control the camera.

## Run locally

Use Node.js **22.13+** (or Node 24 LTS), then:

```sh
npm ci --ignore-scripts
npm run dev
```

Open [http://127.0.0.1:8080](http://127.0.0.1:8080). For a production build:

```sh
npm run build
npm run start
```

Next.js 16.4.0 and React 19.3.0 are pinned in the lockfile. The app uses App Router with four pages:

| Route | Page |
| --- | --- |
| `/` | 현장 가이드 |
| `/map` | 빛 지도 |
| `/planner` | 시간 계획 |
| `/gear` | 내 장비 |

The root layout keeps a typed React provider mounted across navigation. Location, UTC instant, intent, lens and sensor remain shared between pages. React components own the UI; the Next app does not embed the old HTML or execute its global DOM script.

## Maps configuration

Copy `.env.example` to `.env.local` and set:

```dotenv
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id
```

Restrict the browser key by HTTP referrer and to Maps JavaScript API. Both settings are required. Restart development or rebuild production after changes. Never place a server secret in a `NEXT_PUBLIC_` variable.

Google Maps loads only on the map page. Missing configuration or loading failure keeps a labeled schematic and coordinate entry. A is the observer; B is the subject. Marker moves update geometry and astronomy; leaving the page removes map listeners, markers and overlays. Real tile loading and attribution still require verification with the user's own restricted key.

## Calculations and data boundaries

- Browser geolocation runs after a click or already-granted permission. Accuracy and errors are preserved; a late result cannot replace a newer manual location.
- Solar/lunar positions use the shared approximate reference ephemeris, with UTC instants and true-north clockwise azimuths.
- Coordinate-based IANA timezone lookup is approximate and manually correctable. Sliders follow actual civil-day length, including 23/25-hour DST days. The browser supplies timezone/DST rules.
- Golden hour is apparent solar altitude -4°..+6°, blue hour -6°..-4°. Missing polar crossings remain absent. Sunrise/set use approximate apparent solar-center 0° crossings.
- The moon disk shows illumination and waxing/waning; its rotation is schematic.
- Weather remains explicitly labeled fixture data, with null missing cloud layers and absent observation timestamps. There is no live weather proxy or secret.
- Orientation remains a manual demo. Movement heading is never camera heading.
- Plans and equipment stay in localStorage using the existing v1 keys. Valid prior plans with UTC instants migrate on read. Precise coordinates are excluded by default; the planner's checkbox opts in. Header quick-save always excludes coordinates. Invalid stored records are ignored; blocked storage does not crash the app.

## Source

- `src/app/`: Next.js routes, root layout, global CSS and metadata.
- `src/components/`: React views, controls, diagrams and Google Maps lifecycle.
- `src/state/`: typed shared state and validated persistence.
- `src/domains/`: astronomy, timing, location, maps geometry/loader, weather, recommendations and gear.
- `reference/`: shared approximate ephemeris and geometry reference tests.
- `prototype/index.html`: retained standalone functional reference.
- `src/index.html`, `src/ui.js`, `scripts/build.mjs`: legacy prototype sources. `npm run build:prototype` rebuilds that reference only; the Next app does not consume them.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run start
# In another terminal, with the server running:
npm run test:e2e
```

The E2E suite uses real Next.js HTTP routes and browser hydration. It defaults to Codex's bundled Playwright and installed Chrome. Set `PLAYWRIGHT_MODULE` to your Playwright `index.mjs`, `BROWSER_CHANNEL` and `TEST_URL` as needed. Reports/screenshots go to `qa/current/next/`.

For isolated mock Maps integration, build a separate output and start it on another port:

```sh
NEXT_BUILD_DIR=.next-maps NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TEST_KEY_ONLY NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=TEST_MAP_ID npm run build
NEXT_BUILD_DIR=.next-maps npx next start --hostname 127.0.0.1 --port 8081
TEST_URL=http://127.0.0.1:8081 node qa/next-browser.mjs --maps
```

This uses a fake key and intercepted mock API. It does not validate real Google tiles, billing, device GPS or compass sensors. `qa/browser.mjs` and the Python wrappers remain the legacy standalone-prototype suite.

See [docs/IMPLEMENTATION_LOG.md](docs/IMPLEMENTATION_LOG.md) for genuine verification results and limitations. Nothing has been deployed.
