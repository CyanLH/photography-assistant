import * as reference from '../../reference/astro-engine.mjs';
import {dayBounds} from './timing';
import {validatePoint,type Point} from './location';
export const {getSunPosition,getMoonPosition,getMoonIllumination,moonPhaseName,moonDiskSvg}=reference;
export function calculate(instant:Date,point:Point){
 validatePoint(point);if(!Number.isFinite(+instant))throw new Error('Invalid UTC instant');
 const sun=getSunPosition(instant,point.lat,point.lng),moon=getMoonPosition(instant,point.lat,point.lng),phase=getMoonIllumination(instant);
 return {sunAz:sun.azimuth,sunAlt:sun.altitude,moonAz:moon.azimuth,moonAlt:moon.altitude,moonPhase:phase.phase,moonFraction:phase.fraction,moonName:moonPhaseName(phase.phase),moonWaxing:phase.waxing,calculatedFor:instant};
}
export type Sky = ReturnType<typeof calculate>;
type Crossing={at:Date;minutes:number;kind:'rise'|'set'};
export function solarWindows(date:string,zone:string,point:Point){
 validatePoint(point);const {start,end}=dayBounds(date,zone);
 const crossings:Record<number,{rise:Crossing|null;set:Crossing|null}>={};
 for(const threshold of [-6,-4,0,6]){
  const roots:Crossing[]=[];const alt=(t:number)=>getSunPosition(new Date(t),point.lat,point.lng).altitude-threshold;
  let previous=start,a=alt(start);
  for(let t=start+180000;t<=end+180000;t+=180000){
   const current=Math.min(t,end),b=alt(current);
   if((a<0&&b>=0)||(a>0&&b<=0)){
    let lo=previous,hi=current;for(let i=0;i<20;i++){const m=(lo+hi)/2;if(alt(m)*a>0)lo=m;else hi=m;}
    const at=new Date((lo+hi)/2);if(+at<end)roots.push({at,minutes:(+at-start)/60000,kind:b>a?'rise':'set'});
   }
   if(current===end)break;previous=current;a=b;
  }
  crossings[threshold]={rise:roots.find(r=>r.kind==='rise')??null,set:roots.findLast(r=>r.kind==='set')??null};
 }
 const time=(deg:number,k:'rise'|'set')=>crossings[deg][k]?.minutes??null;
 const pair=(a:number|null,b:number|null)=>a!==null&&b!==null&&a<b?[a,b]:null;
 return {sunrise:time(0,'rise'),sunset:time(0,'set'),goldenAM:pair(time(-4,'rise'),time(6,'rise')),goldenPM:pair(time(6,'set'),time(-4,'set')),blueAM:pair(time(-6,'rise'),time(-4,'rise')),bluePM:pair(time(-4,'set'),time(-6,'set')),_crossings:crossings};
}
