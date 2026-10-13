export type Weather={mode:'fixture'|'unavailable';source:string;validAt:number|null;retrievedAt:number|null;cloudLowPct:number|null;cloudMidPct:number|null;cloudHighPct:number|null};
export function fixtureWeather(cloudy:boolean):Weather {return {mode:'fixture',source:'내장 예시 · 관측/예보 시각 없음',validAt:null,retrievedAt:null,cloudLowPct:cloudy?88:12,cloudMidPct:null,cloudHighPct:null};}
export function weatherValue(value:number|null,unit:string):string{return value===null?'제공 안 됨':`${value}${unit}`;}
