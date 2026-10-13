import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE||`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`));
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const base=process.env.TEST_URL||'http://127.0.0.1:8080';
await mkdir('qa/current/next',{recursive:true});let checks=0;
const check=(value,name)=>{assert.ok(value,name);checks++;console.log('PASS',name);};
try{
if(!process.argv.includes('--maps')){
for(const [width,height] of [[360,800],[390,844],[768,1024],[1440,1080]]){
 const context=await browser.newContext({viewport:{width,height},timezoneId:'America/Los_Angeles'});
 await context.addInitScript(()=>{window.__gpsCalls=0;Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:()=>window.__gpsCalls++},configurable:true});});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 for(const route of ['/','/map','/planner','/gear']){
  const response=await page.goto(base+route);check(response.status()===200,`${width} ${route} direct HTTP 200`);await page.waitForSelector('section.view');
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width} ${route} no horizontal overflow`);
  await page.screenshot({path:`qa/current/next/${width}-${route==='/'?'field':route.slice(1)}.png`,fullPage:true});
 }
 check(errors.length===0,`${width} no hydration/runtime errors: ${errors.join(',')}`);check(await page.evaluate(()=>window.__gpsCalls)===0,`${width} no unconsented GPS`);
 if(width===390){
  const nav='#mobileNav';await page.locator(`${nav} a[href="/"]`).click();await page.waitForSelector('#sourceBanner');
  check((await page.locator('#sourceBanner').textContent()).includes('Asia/Seoul'),'selected timezone independent of device');
  const first=await page.locator('#sunAlt').textContent();await page.locator('#fieldTime').fill('200');check(first!==await page.locator('#sunAlt').textContent(),'time changes computed sky');
  await page.locator('.locbtn').click();await page.locator('#manualLat').fill('40.7128');await page.locator('#manualLng').fill('-74.006');await page.locator('#manualSetLocation').click();check((await page.locator('#sourceBanner').textContent()).includes('America/New_York'),'manual location timezone');
  await page.locator(`${nav} a[href="/gear"]`).click();await page.locator('#gearLens').fill('135');await page.locator('#saveGear').click();
  await page.locator(`${nav} a[href="/planner"]`).click();await page.locator('#planDate').fill('2026-11-01');check(await page.locator('#plannerTime').getAttribute('max')==='1499','DST fall 25 hour slider');
  await page.locator('#plannerTime').fill('90');const firstHour=await page.locator('#timeLabel').textContent();await page.locator('#plannerTime').fill('150');check(firstHour!==await page.locator('#timeLabel').textContent(),'DST repeated hour distinct GMT offset');
  await page.locator('#plannerSave').click();let plans=await page.evaluate(()=>JSON.parse(localStorage.getItem('photography-assistant-plans-v1')));check(plans[0].lat===undefined&&plans[0].lng===undefined,'save excludes coordinates by default');
  await page.locator('#saveLocationConsent').check();await page.locator('#plannerSave').click();plans=await page.evaluate(()=>JSON.parse(localStorage.getItem('photography-assistant-plans-v1')));check(plans[1].lat===40.7128&&plans[1].lens===135,'shared gear and coordinate consent');
  await page.locator('#planDate').fill('2026-06-01');await page.getByRole('button',{name:'이 조건 불러오기'}).first().click();await page.waitForURL(base+'/');check((await page.locator('#sourceBanner').textContent()).includes('2026-11-01'),'plan restores selected date across route');
  await page.locator(`${nav} a[href="/gear"]`).click();check(await page.locator('#gearLens').inputValue()==='135','gear preserved across Next navigation');await page.goBack();await page.waitForSelector('#view-field');check((await page.locator('#sourceBanner').textContent()).includes('40.7128'),'browser Back preserves session location');
  await page.locator('.locbtn').click();await page.locator('#manualLat').fill('');await page.locator('#manualSetLocation').click();check(await page.locator('#appDialog').isVisible(),'empty latitude rejected');await page.keyboard.press('Escape');check(await page.locator('.locbtn').evaluate(e=>e===document.activeElement),'native dialog focus restored');
  await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=(_ok,fail)=>fail({code:1});});await page.locator('#gpsQuickButton').click();check((await page.locator('#toast').textContent()).includes('거부'),'GPS denial message');
  await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.4981,longitude:127.0276,accuracy:12.4,heading:99},timestamp:Date.now()});});await page.locator('#gpsQuickButton').click();await page.waitForFunction(()=>document.getElementById('locationName').textContent.includes('±12m'));check((await page.locator('#compassSvg').textContent()).includes('230°'),'movement heading not camera heading');
  await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=ok=>{window.pendingGps=ok;};});await page.locator('#gpsQuickButton').click();await page.locator('.locbtn').click();await page.locator('#manualLat').fill('89');await page.locator('#manualLng').fill('15');await page.locator('#manualSetLocation').click();await page.evaluate(()=>pendingGps({coords:{latitude:1,longitude:2,accuracy:3},timestamp:Date.now()}));check((await page.locator('#sourceBanner').textContent()).includes('89.0000'),'late GPS does not overwrite manual');
  await page.locator(`${nav} a[href="/planner"]`).click();await page.locator('#planDate').fill('2026-06-21');check(await page.locator('.window-card:disabled').count()===4,'polar no event cards');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('blocked');};});await page.locator('#plannerSave').click();check((await page.locator('#toast').textContent()).includes('차단'),'blocked storage does not crash');
  check(errors.length===0,'all interactions free of hydration/runtime errors');
 }
 await context.close();
}
}
if(process.argv.includes('--maps')){
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const mock=`window.__maps=[];window.__markers=[];window.__shapes=[];class MapMock{constructor(el,o){this.options=o;this.handlers={};__maps.push(this);window.__map=this;}addListener(k,f){this.handlers[k]=f;return {remove:()=>delete this.handlers[k]};}panTo(p){this.center=p;}}class Shape{constructor(o){this.options=o;__shapes.push(this);}setMap(m){this.map=m;}}class Marker{constructor(o){Object.assign(this,o);this.handlers={};__markers.push(this);}addListener(k,f){this.handlers[k]=f;return {remove:()=>delete this.handlers[k]};}}window.google={maps:{Map:MapMock,Polygon:Shape,Polyline:Shape,importLibrary:async n=>n==='maps'?{Map:MapMock}:{AdvancedMarkerElement:Marker}}};window.__photographyAssistantMapsReady();`;
 await page.route('https://maps.googleapis.com/**',r=>r.fulfill({contentType:'text/javascript',body:mock}));await page.goto(base+'/map');await page.waitForSelector('.maps-ready');
 check(await page.evaluate(()=>__markers.length===2&&__shapes.length>=4),'Google mock markers and overlays');
 await page.getByRole('button',{name:'촬영자 옮기기'}).click();await page.evaluate(()=>__map.handlers.click({latLng:{toJSON:()=>({lat:40.7,lng:-74})}}));await page.waitForFunction(()=>document.getElementById('observerCoords').textContent.includes('40.70000'));check(true,'Google A click updates observer');
 await page.locator('#mobileNav a[href="/planner"]').click();await page.waitForSelector('#planDate');check((await page.locator('#plannerDateLabel').textContent()).includes('America/New_York'),'Google A updates timezone across route');
 check(await page.evaluate(()=>__markers.every(m=>m.map===null)&&__shapes.every(s=>s.map===null)),'map resources cleaned on route exit');
 await page.locator('#mobileNav a[href="/map"]').click();await page.waitForSelector('.maps-ready');await page.evaluate(()=>{const marker=__markers.at(-2);marker.position={lat:-33.86,lng:151.2};marker.handlers.dragend();});await page.waitForFunction(()=>document.getElementById('observerCoords').textContent.includes('-33.86000'));check(true,'Google A drag after route remount');
 const before=await page.locator('#mapBearing').textContent();await page.evaluate(()=>__map.handlers.click({latLng:{toJSON:()=>({lat:-33.85,lng:151.19})}}));check(before!==await page.locator('#mapBearing').textContent(),'Google B click changes bearing');check(errors.length===0,`map no runtime errors ${errors}`);await context.close();
 const failed=await browser.newPage();await failed.route('https://maps.googleapis.com/**',r=>r.abort());await failed.goto(base+'/map');await failed.waitForFunction(()=>document.getElementById('mapProviderStatus')?.textContent.includes('실패'));check(await failed.locator('#mapSvg').isVisible(),'failed map retains schematic');await failed.close();
}
await writeFile(`qa/current/next/${process.argv.includes('--maps')?'maps':'ui'}.json`,JSON.stringify({checks,status:'passed',realGoogleTiles:false,physicalGPS:false},null,2));console.log(`TOTAL ${checks} checks passed`);
}finally{await browser.close();}
