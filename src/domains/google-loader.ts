let pending:Promise<typeof google.maps>|null=null;
declare global {interface Window {google?:typeof google;__photographyAssistantMapsReady?:()=>void;gm_authFailure?:()=>void;}}
/** Loads only on the client and only when the map screen requests it. */
export function loadGoogleMaps(key:string):Promise<typeof google.maps>{
 if(typeof window.google?.maps?.importLibrary==='function')return Promise.resolve(window.google.maps);
 if(pending)return pending;
 pending=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const fail=(message:string)=>{clearTimeout(timer);script.remove();pending=null;reject(new Error(message));};
  const timer=setTimeout(()=>fail('Google Maps 요청 시간이 초과되었습니다.'),12000);
  window.gm_authFailure=()=>fail('Google Maps 키 또는 도메인 제한을 확인하세요.');
  window.__photographyAssistantMapsReady=()=>{clearTimeout(timer);if(window.google?.maps)resolve(window.google.maps);else fail('Google Maps 라이브러리를 사용할 수 없습니다.');};
  script.async=true;script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&callback=__photographyAssistantMapsReady&language=ko`;
  script.onerror=()=>fail('Google Maps를 불러오지 못했습니다.');document.head.appendChild(script);
 });return pending;
}
