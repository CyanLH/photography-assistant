import assert from 'node:assert/strict';
import test from 'node:test';
import {getSunPosition,getMoonPosition,getMoonIllumination,findSolarWindows,moonPhaseName,moonDiskSvg} from './astro-engine.mjs';
const seoul={lat:37.5665,lon:126.978};
function atMinute(day,minute){return new Date(day.getFullYear(),day.getMonth(),day.getDate(),Math.floor(minute/60),Math.floor(minute%60));}
test('valid azimuth and altitude geometry',()=>{
 const noon=getSunPosition(new Date('2026-10-12T03:00:00Z'),seoul.lat,seoul.lon);
 assert.ok(noon.azimuth>160&&noon.azimuth<205);
 assert.ok(noon.altitude>35&&noon.altitude<55);
 const moon=getMoonPosition(new Date('2026-10-12T03:00:00Z'),seoul.lat,seoul.lon);
 assert.ok(moon.azimuth>=0&&moon.azimuth<360);assert.ok(moon.altitude>-90&&moon.altitude<=90);
});
test('astronomy changes with both time and coordinates',()=>{
 const time=new Date('2026-10-12T03:00:00Z');
 const a=getSunPosition(time,seoul.lat,seoul.lon);const b=getSunPosition(time,64.14,-21.9);
 assert.ok(Math.abs(a.altitude-b.altitude)>20);
 const c=getSunPosition(new Date('2026-10-12T06:00:00Z'),seoul.lat,seoul.lon);
 assert.ok(Math.abs(a.altitude-c.altitude)>10);
});
test('moon phase fraction, visibility and disk shape',()=>{
 const illum=getMoonIllumination(new Date('2026-10-12T03:00:00Z'));
 assert.ok(illum.fraction>=0&&illum.fraction<=1);
 assert.ok(illum.phase>=0&&illum.phase<=1);
 assert.equal(typeof moonPhaseName(illum.phase),'string');
 assert.ok(moonDiskSvg(illum.phase).includes('<polygon'));
 assert.equal(moonPhaseName(.07),'차오르는 초승달');
 assert.equal(moonPhaseName(.5),'보름달');
 assert.equal(moonPhaseName(.75),'하현달');
});
test('Seoul solar windows on selected date: calculated not fixed fixtures',()=>{
 process.env.TZ='Asia/Seoul';
 const day=new Date(2026,9,12);const w=findSolarWindows(day,seoul.lat,seoul.lon);
 assert.ok(w.sunrise>360&&w.sunrise<440);
 assert.ok(w.sunset>1030&&w.sunset<1120);
 for(const key of ['goldenAM','goldenPM','blueAM','bluePM']){
  assert.ok(w[key]);assert.ok(w[key][1]>w[key][0]);
 }
 assert.ok(Math.abs(getSunPosition(atMinute(day,w.goldenPM[0]),seoul.lat,seoul.lon).altitude-6)<.1);
 assert.ok(Math.abs(getSunPosition(atMinute(day,w.bluePM[1]),seoul.lat,seoul.lon).altitude+6)<.1);
});
test('Latitude and season change golden hour and daylight',()=>{
 process.env.TZ='Asia/Seoul';
 const oct=findSolarWindows(new Date(2026,9,12),seoul.lat,seoul.lon);
 const jun=findSolarWindows(new Date(2026,5,12),seoul.lat,seoul.lon);
 assert.ok(Math.abs(oct.sunset-jun.sunset)>30);
 assert.ok(Math.abs(oct.sunrise-jun.sunrise)>30);
});
test('polar daylight handles missing transitions without fake golden times',()=>{
 process.env.TZ='Europe/Oslo';
 const w=findSolarWindows(new Date(2026,5,21),80,15);
 assert.equal(w.sunrise,null);assert.equal(w.sunset,null);assert.equal(w.goldenPM,null);
});
test('DST dates do not throw or incorrectly force 24h epoch',()=>{
 process.env.TZ='America/New_York';
 const w=findSolarWindows(new Date(2026,2,8),40.7128,-74.006);
 assert.ok(w.sunrise>300&&w.sunrise<600);
 assert.ok(w.sunset>900&&w.sunset<1250);
});
test('invalid coordinates are rejected',()=>{
 assert.throws(()=>getSunPosition(new Date(),91,0));
 assert.throws(()=>getMoonPosition(new Date(),1,190));
});
