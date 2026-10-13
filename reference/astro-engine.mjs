// Local ephemeris calculations adapted from SunCalc's MIT-licensed algorithms.
// Uses JavaScript Date UTC instants and observer geodetic lat/lon.
// Approximate geometric celestial coordinates; refraction is approximate.
// This module computes astronomical predictions, not measured local visibility.
const RAD = Math.PI / 180;
const E = RAD * 23.4397;
const J1970 = 2440588;
const J2000 = 2451545;
const DAY = 86400000;
const sin = Math.sin, cos = Math.cos, tan = Math.tan;
const asin = Math.asin, acos = Math.acos, atan2 = Math.atan2;
const toDays = d => d.valueOf() / DAY - 0.5 + J1970 - J2000;
const rightAscension = (l,b) => atan2(sin(l)*cos(E)-tan(b)*sin(E),cos(l));
const declination = (l,b) => asin(sin(b)*cos(E)+cos(b)*sin(E)*sin(l));
const sidereal = (d,lw) => RAD*(280.16 + 360.9856235*d)-lw;
const azimuth = (h,phi,dec) => atan2(sin(h),cos(h)*sin(phi)-tan(dec)*cos(phi));
const altitude = (h,phi,dec) => asin(sin(phi)*sin(dec)+cos(phi)*cos(dec)*cos(h));
const angle360 = x => ((x % 360) + 360) % 360;
const astroRefraction = h => {const positive=Math.max(h,0);return 0.0002967 / Math.tan(positive+0.00312536/(positive+0.08901179));};
function sunCoords(d) {
  const M=RAD*(357.5291+0.98560028*d);
  const C=RAD*(1.9148*sin(M)+0.02*sin(2*M)+0.0003*sin(3*M));
  const L=M+C+RAD*102.9372+Math.PI;
  return {ra:rightAscension(L,0),dec:declination(L,0)};
}
function moonCoords(d) {
  const L=RAD*(218.316+13.176396*d);
  const M=RAD*(134.963+13.064993*d);
  const F=RAD*(93.272+13.229350*d);
  const l=L+RAD*6.289*sin(M);
  const b=RAD*5.128*sin(F);
  const dist=385001-20905*cos(M);
  return {ra:rightAscension(l,b),dec:declination(l,b),dist};
}
function position(coords,date,lat,lon){
  const d=toDays(date),phi=lat*RAD,lw=-lon*RAD,H=sidereal(d,lw)-coords.ra;
  const h=altitude(H,phi,coords.dec);
  return {azimuth:angle360(180+azimuth(H,phi,coords.dec)/RAD),altitude:(h+astroRefraction(h))/RAD,
    parallacticAngle:atan2(sin(H),tan(phi)*cos(coords.dec)-sin(coords.dec)*cos(H))/RAD};
}
export function getSunPosition(date,lat,lon){
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||Number.isNaN(+date))throw Error('Invalid astro input');
  return position(sunCoords(toDays(date)),date,lat,lon);
}
export function getMoonPosition(date,lat,lon){
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180||Number.isNaN(+date))throw Error('Invalid astro input');
  const m=moonCoords(toDays(date)),p=position(m,date,lat,lon);return {...p,distanceKm:m.dist};
}
export function getMoonIllumination(date){
  const d=toDays(date),s=sunCoords(d),m=moonCoords(d),sunDist=149598000;
  const phi=acos(Math.min(1,Math.max(-1,sin(s.dec)*sin(m.dec)+cos(s.dec)*cos(m.dec)*cos(s.ra-m.ra))));
  const inc=atan2(sunDist*sin(phi),m.dist-sunDist*cos(phi));
  const angle=atan2(cos(s.dec)*sin(s.ra-m.ra),sin(s.dec)*cos(m.dec)-cos(s.dec)*sin(m.dec)*cos(s.ra-m.ra));
  const phase=0.5+0.5*inc*(angle<0?-1:1)/Math.PI;
  return {fraction:(1+cos(inc))/2,phase,angle:angle/RAD,waxing:phase<0.5};
}
export function moonPhaseName(phase){
  const p=((phase%1)+1)%1;
  if(p<0.025||p>=0.975)return '삭';
  if(p<0.225)return '차오르는 초승달';
  if(p<0.275)return '상현달';
  if(p<0.475)return '차오르는 볼록달';
  if(p<0.525)return '보름달';
  if(p<0.725)return '기우는 볼록달';
  if(p<0.775)return '하현달';
  return '기우는 그믐달';
}
// The disk illustration shows illuminated fraction and waxing/waning, not sky rotation.
export function moonDiskSvg(phase,size=48){
  const cx=28,cy=28,r=23,steps=60,waxing=phase<0.5,c=Math.cos(2*Math.PI*phase);
  const outer=[],terminator=[];
  for(let i=0;i<=steps;i++){
    const y=-r+i*2*r/steps,x=Math.sqrt(Math.max(0,r*r-y*y));
    outer.push([cx+(waxing?x:-x),cy+y]);terminator.push([cx+(waxing?c:-c)*x,cy+y]);
  }
  const points=[...outer,...terminator.reverse()].map(p=>p.map(q=>q.toFixed(2)).join(',')).join(' ');
  return `<svg viewBox="0 0 56 56" width="${size}" height="${size}" aria-hidden="true"><circle cx="28" cy="28" r="23" fill="#34394b"/><polygon points="${points}" fill="#efeff8"/><circle cx="28" cy="28" r="23" fill="none" stroke="#a0a3c7" stroke-width="1.2"/></svg>`;
}
function sunAltitude(instant,lat,lon){return getSunPosition(instant,lat,lon).altitude;}
// Find transitions of a solar-altitude threshold within the device-local calendar day.
// For location timezone mismatches, the UI must state it uses device-local time.
export function findSolarWindows(day,lat,lon){
  const from=new Date(day.getFullYear(),day.getMonth(),day.getDate()).getTime();
  const to=new Date(day.getFullYear(),day.getMonth(),day.getDate()+1).getTime();
  const crossings={};
  for(const threshold of [-6,-4,0,6]){
    const arr=[];const step=180000;
    let prevT=from,prevAlt=sunAltitude(new Date(prevT),lat,lon)-threshold;
    for(let t=from+step;t<=to+step;t+=step){
      const currT=Math.min(t,to),currAlt=sunAltitude(new Date(currT),lat,lon)-threshold;
      if(prevAlt*currAlt<0){
        let lo=prevT,hi=currT;
        for(let i=0;i<17;i++){
          const mid=(lo+hi)/2,midAlt=sunAltitude(new Date(mid),lat,lon)-threshold;
          if(midAlt*prevAlt>0)lo=mid;else hi=mid;
        }
        const at=new Date((lo+hi)/2);
        arr.push({at,minutes:at.getHours()*60+at.getMinutes()+at.getSeconds()/60,kind:currAlt>prevAlt?'rise':'set'});
      }
      if(currT===to)break;
      prevT=currT;prevAlt=currAlt;
    }
    crossings[threshold]={rise:arr.find(x=>x.kind==='rise')??null,set:arr.findLast(x=>x.kind==='set')??null};
  }
  const time=(deg,k)=>crossings[deg][k]?.minutes??null;
  const interval=(start,end)=>start!==null&&end!==null&&start<end?[start,end]:null;
  return {sunrise:time(0,'rise'),sunset:time(0,'set'),
    goldenAM:interval(time(-4,'rise'),time(6,'rise')),
    goldenPM:interval(time(6,'set'),time(-4,'set')),
    blueAM:interval(time(-6,'rise'),time(-4,'rise')),
    bluePM:interval(time(-4,'set'),time(-6,'set')),
    _crossings:crossings};
}
