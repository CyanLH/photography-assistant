import test from 'node:test';
import assert from 'node:assert/strict';
import {astronomy as a,timing as t,location as l,maps,gear,weather,recommendation} from '../dist/test/domains/index.mjs';
import {createRequire} from 'node:module';
const engine=createRequire(import.meta.url)('astronomy-engine');
const seoul={lat:37.5665,lng:126.978};
test('coordinate timezone, date line and device independence',()=>{
 assert.equal(t.locationTimezone(seoul),'Asia/Seoul');assert.equal(t.locationTimezone({lat:40.7,lng:-74}),'America/New_York');
 const instant=new Date('2026-01-01T10:30:00Z');assert.equal(t.dateKey(instant,'Pacific/Kiritimati'),'2026-01-02');assert.equal(t.dateKey(instant,'Pacific/Honolulu'),'2026-01-01');
});
test('DST civil day bounds and repeated hours preserve UTC',()=>{
 assert.equal(t.dayBounds('2026-03-08','America/New_York').minutes,1380);assert.equal(t.dayBounds('2026-11-01','America/New_York').minutes,1500);
 assert.equal(t.timeLabel(new Date('2026-11-01T05:30:00Z'),'America/New_York'),t.timeLabel(new Date('2026-11-01T06:30:00Z'),'America/New_York'));
 assert.notEqual(t.timeLabel(new Date('2026-11-01T05:30:00Z'),'America/New_York',true),t.timeLabel(new Date('2026-11-01T06:30:00Z'),'America/New_York',true));
 assert.throws(()=>t.dayBounds('2011-12-30','Pacific/Apia'));assert.throws(()=>t.dayBounds('2026-02-30','Asia/Seoul'));
});
test('all altitude roots meet thresholds and polar none',()=>{
 for(const [date,zone,point] of [['2026-10-12','Asia/Seoul',seoul],['2026-03-08','America/New_York',{lat:40.7,lng:-74}],['2026-11-01','America/New_York',{lat:40.7,lng:-74}]]){
 const windows=a.solarWindows(date,zone,point);for(const [threshold,crossings] of Object.entries(windows._crossings))for(const root of Object.values(crossings)){assert.ok(root);assert.ok(Math.abs(a.calculate(root.at,point).sunAlt-Number(threshold))<.001);assert.equal(t.dateKey(root.at,zone),date);}
 }
 for(const date of ['2026-06-21','2026-12-21']){const w=a.solarWindows(date,'Europe/Oslo',{lat:89,lng:15});for(const k of ['sunrise','sunset','blueAM','bluePM','goldenAM','goldenPM'])assert.equal(w[k],null);}
});
test('independent Astronomy Engine fixtures: north-clockwise degrees and illumination',()=>{
 for(const [iso,point] of [['2026-10-12T03:00:00Z',seoul],['2026-03-20T14:00:00Z',{lat:40.7,lng:-74}],['2026-07-01T04:00:00Z',{lat:-33.86,lng:151.2}]]){
 const date=new Date(iso),actual=a.calculate(date,point),observer=new engine.Observer(point.lat,point.lng,0);
 for(const body of ['Sun','Moon']){const eq=engine.Equator(body,date,observer,true,true),expected=engine.Horizon(date,observer,eq.ra,eq.dec,'normal'),prefix=body.toLowerCase();
 const angle=Math.abs(((actual[prefix+'Az']-expected.azimuth+540)%360)-180);assert.ok(angle<(body==='Sun'?1:3),`${body} az ${angle}`);assert.ok(Math.abs(actual[prefix+'Alt']-expected.altitude)<(body==='Sun'?1:3));}
 assert.ok(Math.abs(actual.moonFraction-engine.Illumination('Moon',date).phase_fraction)<.025);
 }
});
test('moon disk illuminated area at new quarter full and waning quarter',()=>{
 for(const phase of [0,.25,.5,.75,1]){
 const svg=a.moonDiskSvg(phase);const points=svg.match(/points="([^"]+)"/)[1].split(' ').map(p=>p.split(',').map(Number));let area=0;points.forEach((p,i)=>{const q=points[(i+1)%points.length];area+=p[0]*q[1]-q[0]*p[1];});
 assert.ok(Math.abs(Math.abs(area)/2/(Math.PI*23**2)-(1-Math.cos(2*Math.PI*phase))/2)<.004);
 }
});
test('geolocation consent entry uses high accuracy and preserves failures',async()=>{
 let options;const result=await l.locate({getCurrentPosition(ok,_fail,opts){options=opts;ok({coords:{latitude:1,longitude:2,accuracy:35,heading:222},timestamp:123});}});
 assert.equal(options.enableHighAccuracy,true);assert.equal(options.timeout,12000);assert.equal(result.accuracy,35);assert.equal(result.capturedAt,123);assert.equal(result.heading,undefined);
 for(const code of [1,2,3])await assert.rejects(l.locate({getCurrentPosition(_ok,fail){fail({code});}}),e=>e.code===code);
 assert.throws(()=>l.parsePoint('','0'));assert.throws(()=>l.parsePoint('91','0'));assert.deepEqual(l.parsePoint('0','0'),{lat:0,lng:0});
});
test('gear, maps and source boundaries',()=>{
 assert.ok(Math.abs(gear.fieldOfView(36,24,35,'landscape')-54.432)<.001);const dest=maps.destinationGeo(seoul,90,220);assert.ok(Math.abs(maps.geoBearing(seoul,dest)-90)<.001);
 assert.equal(weather.weatherValue(null,'%'),'제공 안 됨');assert.equal(weather.weatherValue(0,'%'),'0%');assert.equal(weather.fixtureWeather(false).validAt,null);
 const sky={...a.calculate(new Date('2026-10-12T03:00:00Z'),seoul),sunAlt:-20,moonAlt:-3};
 assert.match(recommendation.recommend(sky,{intent:'portrait',lens:35,aperture:4,tripod:false}).light,/직접광 없음/);
 assert.match(recommendation.recommend(sky,{intent:'moon',lens:35,aperture:4,tripod:false}).badge,/보류/);
});
