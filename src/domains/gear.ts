export function fieldOfView(width:number,height:number,lens:number,orientation:string):number {
 if(![width,height,lens].every(v=>Number.isFinite(v)&&v>0))throw new RangeError('Invalid gear dimensions');
 return 2*Math.atan((orientation==='portrait'?height:width)/(2*lens))*180/Math.PI;
}
