# Google Maps JavaScript API 설정 및 운영

## Next.js 현재 설정

`.env.local`의 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`와 `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`를 사용합니다. 둘 다 필요하며 변경 후 개발 서버 재시작 또는 프로덕션 재빌드가 필요합니다. HTTP referrer와 Maps JavaScript API 제한을 설정하세요. 지도 경로 `/map`에서만 로드하고 경로 이탈 시 리스너·마커·오버레이를 정리합니다. 아래 HTML 설정은 보존된 프로토타입에만 적용합니다.

## 지도 구현 방식
지도 제공자는 Google Maps JavaScript API로 고정했다. 미러리스 촬영자가 스마트폰으로 보는 지도 위에 촬영자 A, 피사체 B를 드래그 가능한 AdvancedMarker로 표시하고, A→B 촬영 방향선, 실제 초점거리/센서로 계산한 수평 화각 영역, 선택 시각의 태양·달 **계산** 방위선을 그린다. 샘플 좌표는 서울 DDP 인근이며 실제 GPS와 무관하다.

## 1. Google Cloud 설정
1. Google Cloud Console에서 프로젝트를 만들고, 결제 계정을 연결한 후 **Maps JavaScript API**를 사용 설정한다. 과금 정책과 무료/유료 이용 한도를 직접 확인한다.
2. API 키를 발급하고 **Application restriction → Websites (HTTP referrers)** 를 선택한다. 개발 예: `http://localhost:8080/*` 또는 `http://127.0.0.1:8080/*` 및 실제 배포 도메인을 명시한다.
3. **API restrictions → Restrict key → Maps JavaScript API** 를 선택한다. 기존 기상/Geocoding 서버 키와 분리한다.
4. Advanced Marker를 위한 JavaScript Maps Map ID를 만든다. 데모의 `DEMO_MAP_ID`는 개발 참고용으로만 사용하고 배포 시 본인 Map ID로 교체한다.
5. Google Maps Platform 정책에 따라 지도 로고, 저작권, 제3자 attribution을 읽을 수 있게 유지한다. 사용자의 정밀 위치가 Google Maps에 전송될 수 있음을 개인정보 안내에 반영한다.

## 2. HTML 프로토타입에서 키 설정
`prototype/index.html` `<head>`에서 아래 값을 입력한다.

```javascript
window.Photography Assistant_CONFIG = {
  googleMapsApiKey: "YOUR_RESTRICTED_BROWSER_KEY",
  googleMapsMapId: "YOUR_MAP_ID"
};
```

로컬 서버 권장:

```bash
cd prototype
python3 -m http.server 8080
# http://localhost:8080
```

상단 `빛 지도`를 선택하면 Google Maps JS API가 **최초 1회 지연 로드**된다. 두 개의 A/B 핀을 드래그하거나 `촬영자/피사체 옮기기`를 선택한 다음 지도를 클릭한다. `추천 방향으로 초기화` 버튼으로 예시 추천 방위로 B 핀을 이동할 수 있다.

**키가 없으면** 네트워크 지도 로드 요청은 하지 않고, 실제 지리가 아닌 방향 도식과 `GOOGLE MAPS API 키 필요` 라벨을 표시한다. 실제 키/도메인/결제에 문제가 있을 때도 오류 라벨을 표시한다. 도식은 Google 타일이나 실제 위치가 아니다.

## 3. Codex / Next.js 실구현

`.env.local` (커밋 금지):

```dotenv
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_restricted_browser_key
NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID=your_map_id
```

Google Maps JS 웹 API 키는 브라우저에서 네트워크 요청으로 **노출되는 것이 정상**이다. 비밀 서버 키처럼 보호할 수 없으므로 반드시 HTTP referrer와 사용 API를 제한해야 한다. **기상·서버 API 비밀키는 `NEXT_PUBLIC_`을 붙이지 말고 서버에 보관**한다.

Next.js Client Component에서 `@googlemaps/js-api-loader` 또는 공식 Dynamic Library Import를 이용한다. `google.maps.importLibrary('maps')`와 `importLibrary('marker')`로 초기화하고, AdvancedMarker에는 Map ID를 제공한다. 단일 지도 인스턴스를 재사용하고, 위치/시각/렌즈 값 변경 시 기존 Marker·Polyline·Polygon 상태를 갱신한다. 본 HTML은 이해를 위한 단일 파일이며 프로덕션에서는 `MapCanvas`, `MapOverlays`, `useGoogleMaps` 등의 관심사로 분리한다.

Map UI는 지도 클릭, 마커 드래그, 각도/화각 변경, 지도 로딩/키 부재/네트워크 장애, 권한 미동의/수동 위경도, 모바일 회전/리사이즈와 attribution 노출을 테스트한다. 실기기 GPS와 휴대폰 센서는 별도 도메인 문제이므로 지도가 된다고 완료로 처리하지 않는다.

## 4. 검증 범위
- `reference/check_prototype.py` : 34개 UI/상태·반응형 체크 및 화면 캡처 (API 키 없는 fallback).
- `qa/verify_maps_mock.py`: Google Maps JS script 로더·Map/AdvancedMarker/Polyline/Polygon·지도 클릭·bearing 동기화 (네트워크 없는 mock).
- 실제 Google 지도 타일, 실제 청구/키 및 HTTP referrer, 휴대폰 GPS/센서: **미검증**. 승인된 키/프로젝트/네트워크 환경에서 별도 실증 필요.

공식 문서:
- https://developers.google.com/maps/documentation/javascript/load-maps-js-api
- https://developers.google.com/maps/documentation/javascript/get-api-key
- https://developers.google.com/maps/api-security-best-practices
- https://developers.google.com/maps/documentation/javascript/policies


현재 빌드의 키와 Map ID는 `src/index.html` 상단 설정을 수정한 뒤 `npm run build`로 반영합니다. `prototype/index.html`은 생성 결과이며 빌드 시 갱신됩니다. 실제 타일·키 제한·attribution 검증은 아직 수행하지 않았습니다.
