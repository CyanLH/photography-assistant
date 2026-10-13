window.__shapes=[];
window.__markers=[];
class MapMock {
 constructor(_element,options){window.__map=this;this.options=options;this.handlers={};}
 addListener(name,callback){this.handlers[name]=callback;}
 panTo(point){this.center=point;}
}
class ShapeMock {
 constructor(options){window.__shapes.push(options);}
 setMap(map){this.map=map;}
}
class MarkerMock {
 constructor(options){Object.assign(this,options);this.handlers={};window.__markers.push(this);}
 addListener(name,callback){this.handlers[name]=callback;}
}
window.google={maps:{Map:MapMock,Polygon:ShapeMock,Polyline:ShapeMock,importLibrary:async name=>name==='maps'?{Map:MapMock}:{AdvancedMarkerElement:MarkerMock}}};
window.__photographyAssistantMapsReady();
