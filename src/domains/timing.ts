import tzLookup from '@photostructure/tz-lookup';
import {validatePoint,type Point} from './location';
export function locationTimezone(point:Point):string {validatePoint(point);return tzLookup(point.lat,point.lng);}
export function dateKey(instant:Date,zone:string):string {
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant);
 return ['year','month','day'].map(k=>p.find(v=>v.type===k)!.value).join('-');
}
export function timeLabel(instant:Date,zone:string,offset=false):string {
 return new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hourCycle:'h23',...(offset?{timeZoneName:'shortOffset' as const}:{})}).format(instant);
}
const cache=new Map<string,{start:number;end:number;minutes:number}>();
/** UTC bounds for a civil date, including 23/25 hour DST days and skipped dates. */
export function dayBounds(date:string,zone:string) {
 const key=date+'|'+zone,prior=cache.get(key);if(prior)return prior;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('날짜를 확인하세요.');
 const mid=Date.parse(date+'T12:00:00Z');
 if(!Number.isFinite(mid)||new Date(mid).toISOString().slice(0,10)!==date)throw new Error('날짜를 확인하세요.');
 const lower=(target:string)=>{let lo=mid-48*3600000,hi=mid+48*3600000;while(hi-lo>1){const m=Math.floor((hi+lo)/2);if(dateKey(new Date(m),zone)<target)lo=m;else hi=m;}return hi;};
 const next=new Date(mid+86400000).toISOString().slice(0,10),start=lower(date),end=lower(next);
 if(start>=end||dateKey(new Date(start),zone)!==date)throw new Error('이 시간대에 존재하지 않는 날짜입니다.');
 const result={start,end,minutes:(end-start)/60000};if(cache.size>100)cache.clear();cache.set(key,result);return result;
}
