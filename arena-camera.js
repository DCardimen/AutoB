// Crop the scenery for a wide arena; use one scale for both axes so authored
// sprites, hit locations and deployment input keep the same proportions.
export function arenaCamera(width,height){
 const scale=Math.max(width/1002,height/654),viewWidth=width/scale,viewHeight=height/scale;
 return {scale,x:(1002-viewWidth)/2,y:(654-viewHeight)/2,width:viewWidth,height:viewHeight};
}
export function arenaPoint(clientX,clientY,rect){const v=arenaCamera(rect.width,rect.height);return {x:v.x+(clientX-rect.left)/v.scale,y:v.y+(clientY-rect.top)/v.scale};}
