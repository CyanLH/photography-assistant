import type {Sky} from './astronomy';
const norm=(x:number)=>((x%360)+360)%360;
export function recommend(a:Sky,state:{intent:string;aperture:number;lens:number;tripod:boolean}){
 let bearing=a.sunAz,title='태양 방향 촬영',desc='태양 쪽으로 촬영하면 역광 구도가 됩니다. 하늘과 피사체 노출 차이를 확인하세요.',light='역광 후보',badge='노을 · 조건부';
 let setting=['A / Av','F8','ISO 100'],note='정적인 풍경 기준의 시작점입니다. 카메라 측광과 히스토그램으로 노출을 결정하세요.';
 if(state.intent==='landscape'){
  bearing=norm(a.sunAz+180);title='태양 반대 방향';desc='태양을 등지는 순광 구도입니다. 측광과 비교하고 피사체의 실제 그림자를 확인하세요.';light='순광 후보';badge='풍경 · 조건부';
 }
 if(state.intent==='portrait'){
  title='역광 인물 촬영';desc='피사체 뒤쪽에 태양을 두는 구도입니다. 얼굴 노출과 보조광 필요 여부를 확인하세요.';light='인물 역광 후보';badge='인물 · 조건부';
  setting=['M + Auto ISO',`F${Math.max(2.8,state.aperture)}`,'1/250 s*'];note='움직이는 인물의 설정 예시. 셔터·조리개·ISO는 현장 측광에 맞춰 조절하세요.';
 }
 if(state.intent==='moon'){
  bearing=a.moonAz;title=a.moonAlt<=0?'달은 수평선 아래':'달 방향 촬영';
  desc=a.moonAlt<=0?'이 시각 달은 근사 계산상 수평선 아래입니다. 다른 시간을 선택하세요.':`${a.moonName}, 밝은 면 ${(a.moonFraction*100).toFixed(0)}%입니다. 지형 차폐와 하늘 밝기를 확인하세요.`;
  light=`달 고도 ${a.moonAlt.toFixed(1)}°`;badge=a.moonAlt<=0?'달 · 촬영 보류':'달 · 조건부';
  setting=['망원 우선',`F${Math.max(5.6,state.aperture)}`,'시험 촬영'];note=state.lens<135?'이 초점거리에서는 달이 작게 담깁니다. 망원 렌즈와 크롭을 고려하세요.':'달의 밝은 부분이 날아가지 않도록 노출과 셔터를 확인하세요.';
 }
 if(a.sunAlt<0&&state.intent!=='moon'){
  bearing=a.sunAz;title=a.sunAlt>=-6?'박명 방향 확인':'야간 촬영 조건 확인';desc=a.sunAlt>=-6?'태양이 수평선 아래입니다. 계산된 태양 방향의 잔광과 현장 조도를 확인하세요.':'직접 태양광이 없습니다. 달빛과 주변 조명을 확인하고 카메라로 측광하세요.';light=a.sunAlt>=-6?'박명 · 직접광 없음':'야간 · 직접광 없음';badge='잔광 · 조건부';
  setting=state.tripod?['삼각대','F8','낮은 ISO']:['셔터 우선','흔들림 확인','ISO 조정'];note='주변 조도를 카메라로 측광하세요. 움직이는 피사체에는 긴 셔터가 적합하지 않을 수 있습니다.';
 }
 return {bearing,title,desc,light,badge,setting,note};
}
