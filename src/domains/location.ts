export type Point = {lat:number; lng:number};
export type LocationSource = 'sample'|'gps'|'manual'|'map';
export function validatePoint(point:Point):Point {
 if(!Number.isFinite(point.lat)||!Number.isFinite(point.lng)||Math.abs(point.lat)>90||Math.abs(point.lng)>180)throw new RangeError('위도·경도를 확인하세요.');
 return {lat:point.lat,lng:point.lng};
}
export function parsePoint(lat:string,lng:string):Point {
 if(!lat.trim()||!lng.trim())throw new Error('위도와 경도를 모두 입력하세요.');
 return validatePoint({lat:Number(lat),lng:Number(lng)});
}
export function locate(geo:Pick<Geolocation,'getCurrentPosition'>):Promise<{point:Point;accuracy:number;capturedAt:number}> {
 return new Promise((resolve,reject)=>geo.getCurrentPosition(p=>{
  try {resolve({point:validatePoint({lat:p.coords.latitude,lng:p.coords.longitude}),accuracy:p.coords.accuracy,capturedAt:p.timestamp});}catch(e){reject(e);}
 },reject,{enableHighAccuracy:true,timeout:12000,maximumAge:30000}));
}
