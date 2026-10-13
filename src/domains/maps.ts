import type {Point} from './location';
const rad=(deg:number)=>deg*Math.PI/180;
const norm=(x:number)=>((x%360)+360)%360;
export function destinationGeo(origin:Point,bearing:number,meters:number){const r=6371008.8,d=meters/r,lat1=rad(origin.lat),lng1=rad(origin.lng),br=rad(bearing),lat2=Math.asin(Math.sin(lat1)*Math.cos(d)+Math.cos(lat1)*Math.sin(d)*Math.cos(br)),lng2=lng1+Math.atan2(Math.sin(br)*Math.sin(d)*Math.cos(lat1),Math.cos(d)-Math.sin(lat1)*Math.sin(lat2));return {lat:lat2*180/Math.PI,lng:((lng2*180/Math.PI+540)%360)-180}}
export function geoBearing(from:Point,to:Point){const lat1=rad(from.lat),lat2=rad(to.lat),diff=rad(to.lng-from.lng);return norm(Math.atan2(Math.sin(diff)*Math.cos(lat2),Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(diff))*180/Math.PI)}
export function geoDistance(a:Point,b:Point){const dLat=rad(b.lat-a.lat),dLon=rad(b.lng-a.lng),t=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLon/2)**2;return 2*6371008.8*Math.asin(Math.min(1,Math.sqrt(t)))}
