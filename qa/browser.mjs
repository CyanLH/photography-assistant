import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const runtime=process.env.PLAYWRIGHT_MODULE||`${homedir()}/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs`;
const {chromium}=await import(pathToFileURL(runtime));
const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
const html=await readFile('dist/index.html','utf8');
await mkdir('qa/current',{recursive:true});
let checks=0;const check=(value,name)=>{assert.ok(value,name);checks++;console.log('PASS',name);};
try{
for(const [width,height] of (process.argv.includes('--maps')?[]:[[360,800],[390,844],[768,1024],[1440,1080]])){
 const context=await browser.newContext({viewport:{width,height},timezoneId:'America/Los_Angeles'});
 await context.route('http://photography.test/**',r=>r.fulfill({contentType:'text/html',body:html}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://photography.test');
 for(const view of ['field','map','planner','gear']){
  await page.evaluate(view=>photographyAssistantDemo.switchView(view),view);
  check(await page.locator('#view-'+view).isVisible(),`${width} ${view} visible`);
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${width} ${view} no overflow`);
  await page.screenshot({path:`qa/current/${width}-${view}.png`,fullPage:true});
 }
 check((await page.locator('.moon-note').textContent()).includes('회전 방향 미반영'),`${width} schematic moon orientation disclosed`);
 check(errors.length===0,`${width} no runtime errors: ${errors.join(',')}`);
 check((await page.locator('#sourceBanner').textContent()).includes('Asia/Seoul'),`${width} selected timezone independent of device`);
 if(width===390){
 check((await page.evaluate(()=>photographyAssistantDemo.getState())).locationSource==='sample','startup remains explicit example');
  await page.evaluate(()=>photographyAssistantDemo.switchView('field'));
  const before=await page.evaluate(()=>photographyAssistantDemo.astronomy());
  await page.locator('.locbtn').click();await page.locator('#manualLat').fill('40.7128');await page.locator('#manualLng').fill('-74.006');await page.locator('#manualSetLocation').click();
  const after=await page.evaluate(()=>photographyAssistantDemo.astronomy());check(Math.abs(before.sunAlt-after.sunAlt)>5,'manual coordinate changes sky');
  check((await page.locator('#sourceBanner').textContent()).includes('America/New_York'),'manual changes timezone');
  await page.evaluate(()=>photographyAssistantDemo.setTime(200));const first=await page.locator('#sunAlt').textContent();await page.evaluate(()=>photographyAssistantDemo.setTime(800));check(first!==await page.locator('#sunAlt').textContent(),'time changes sky');
  await page.evaluate(()=>photographyAssistantDemo.switchView('planner'));await page.locator('#planDate').fill('2026-11-01');await page.locator('#planDate').dispatchEvent('change');check(await page.locator('#plannerTime').getAttribute('max')==='1499','DST fall 25 hour slider');
  await page.locator('#plannerSave').click();let plans=await page.evaluate(()=>JSON.parse(localStorage.getItem('photography-assistant-plans-v1')));check(!('lat' in plans[0])&&!('lng' in plans[0]),'default plan excludes precise coordinates');
  await page.locator('#saveLocationConsent').check();await page.locator('#plannerSave').click();plans=await page.evaluate(()=>JSON.parse(localStorage.getItem('photography-assistant-plans-v1')));check(plans[1].lat===40.7128,'explicit consent includes coordinates');
  const saved=plans[1];await page.evaluate(()=>{photographyAssistantDemo.setLocation({lat:35,lng:139});photographyAssistantDemo.setDate('2026-06-01');});
  await page.locator('[data-load-plan="1"]').click();const restored=await page.evaluate(()=>photographyAssistantDemo.getState());check(restored.observerGeo.lat===saved.lat&&restored.timezone===saved.timezone,'restore coordinates and timezone');check(await page.evaluate(()=>photographyAssistantDemo.astronomy().calculatedFor.toISOString())===saved.instant,'restore exact UTC instant');
  await page.locator('.locbtn').click();await page.locator('#manualLat').fill('');await page.locator('#manualSetLocation').click();check(await page.locator('#appDialog').isVisible(),'empty latitude rejected');await page.keyboard.press('Escape');
  check(await page.locator('.locbtn').evaluate(e=>e===document.activeElement),'dialog escape restores focus');
  await page.evaluate(()=>{Object.defineProperty(window,'isSecureContext',{value:true});Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(ok,fail)=>fail({code:1})}});});await page.locator('#gpsQuickButton').click();check((await page.locator('#toast').textContent()).includes('거부'),'GPS denial visible');
  await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=ok=>ok({coords:{latitude:37.4981,longitude:127.0276,accuracy:12.4,heading:99},timestamp:Date.now()});});await page.locator('#gpsQuickButton').click();check((await page.locator('#locationName').textContent()).includes('±12m'),'GPS accuracy displayed');check((await page.evaluate(()=>photographyAssistantDemo.getState())).heading===230,'movement heading never camera heading');
  await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=ok=>{window.pendingGps=ok;};});await page.locator('#gpsQuickButton').click();await page.evaluate(()=>{photographyAssistantDemo.setLocation({lat:51.5,lng:0});pendingGps({coords:{latitude:1,longitude:2,accuracy:3},timestamp:Date.now()});});check((await page.evaluate(()=>photographyAssistantDemo.getState())).observerGeo.lat===51.5,'late GPS cannot overwrite manual location');
  await page.evaluate(()=>{photographyAssistantDemo.setLocation({lat:89,lng:15});photographyAssistantDemo.setDate('2026-06-21');photographyAssistantDemo.switchView('planner');});check(await page.locator('.window-card:disabled').count()===4,'polar event cards unavailable');
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError');};});await page.locator('#plannerSave').click();check((await page.locator('#toast').textContent()).includes('차단'),'blocked storage keeps app usable');
  await page.locator('[data-delete-plan="2"]').click();
  await page.locator('[data-delete-plan="1"]').click();check(await page.locator('[data-load-plan]').count()===1,'individual plan deletion');check(errors.length===0,'no runtime errors after interactions');
 }
 await context.close();
}
if(!process.argv.includes('--ui')){
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();page.on('console',m=>console.log('MAP CONSOLE',m.text()));page.on('requestfailed',r=>console.log('MAP REQUEST FAILED',r.url(),r.failure()));const errors=[];page.on('pageerror',e=>errors.push(e.message));
const mapMock=await readFile('qa/google-mock.js','utf8');
await page.route('https://maps.googleapis.com/**',route=>route.fulfill({contentType:'text/javascript',body:mapMock}));
await page.route('http://photography.test/**',r=>r.fulfill({contentType:'text/html',body:html.replace('googleMapsApiKey: ""','googleMapsApiKey: "TEST_KEY_ONLY"')}));await page.goto('http://photography.test');await page.evaluate(()=>photographyAssistantDemo.switchView('map'));await page.waitForFunction(()=>photographyAssistantDemo.googleMapStatus(),{},{timeout:8000}).catch(async e=>{console.log(await page.locator('#mapProviderStatus').textContent(),errors);throw e;});check(await page.evaluate(()=>__markers.length===2&&__shapes.length>=4),'mock Google markers and FOV/celestial overlays');
await page.locator('[data-pin="observer"]').click();await page.evaluate(()=>__map.handlers.click({latLng:{lat:()=>40.7,lng:()=>-74}}));check((await page.evaluate(()=>photographyAssistantDemo.getState())).timezone==='America/New_York','Google A click recalculates timezone');
await page.evaluate(()=>{__markers[0].position={lat:-33.86,lng:151.2};__markers[0].handlers.dragend();});check((await page.evaluate(()=>photographyAssistantDemo.getState())).timezone==='Australia/Sydney','Google A drag recalculates timezone');
await page.locator('[data-pin="subject"]').click();const before=await page.locator('#mapBearing').textContent();await page.evaluate(()=>__map.handlers.click({latLng:{lat:()=>-33.85,lng:()=>151.19}}));check(before!==await page.locator('#mapBearing').textContent(),'Google B changes bearing');
check(errors.length===0,'mock Maps no runtime errors');await context.close();
const failureContext=await browser.newContext();const failure=await failureContext.newPage();
await failure.route('http://photography.test/**',r=>r.fulfill({contentType:'text/html',body:html.replace('googleMapsApiKey: ""','googleMapsApiKey: "TEST_KEY_ONLY"')}));
await failure.route('https://maps.googleapis.com/**',r=>r.abort());await failure.goto('http://photography.test');await failure.evaluate(()=>photographyAssistantDemo.switchView('map'));await failure.waitForFunction(()=>document.getElementById('mapProviderStatus').textContent.includes('실패'));check(await failure.locator('#mapSvg').isVisible(),'Maps network failure keeps truthful schematic');await failureContext.close();

}
await writeFile(`qa/current/${process.argv.includes('--ui')?'ui':process.argv.includes('--maps')?'maps':'browser'}.json`,JSON.stringify({checks,status:'passed',physicalGPS:false,realGoogleTiles:false,liveWeather:false},null,2));console.log(`TOTAL ${checks} checks passed`);
}finally{await browser.close();}
