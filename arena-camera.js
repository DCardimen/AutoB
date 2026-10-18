// Deployment keeps the complete playable board visible. During combat,
// rendering, targeting and overlays share the last displayed encounter camera.
export function arenaCamera(width,height,battle=null){
 const displayed=battle?.viewCamera;
 if(displayed&&Math.abs(displayed.viewportWidth-width)<2&&Math.abs(displayed.viewportHeight-height)<2)return displayed;
 const scale=Math.min(width/1002,height/654),viewWidth=width/scale,viewHeight=height/scale;
 return {scale,x:(1002-viewWidth)/2,y:(654-viewHeight)/2,width:viewWidth,height:viewHeight};
}
export function arenaPoint(clientX,clientY,rect,battle=null){const v=arenaCamera(rect.width,rect.height,battle);return {x:v.x+(clientX-rect.left)*v.width/rect.width,y:v.y+(clientY-rect.top)*v.height/rect.height};}

// Frame living silhouettes, not empty scenery. Include a fallen capture target
// and generous weapon/projectile margins; input reads this exact rendered view.
export function updateArenaCamera(width,height,battle,time){
 if(!battle)return arenaCamera(width,height);
 const units=battle.units.filter(u=>u.hp>0&&!u.captured||battle.captureScene?.uid===u.uid);
 if(!units.length)return arenaCamera(width,height,battle);
 const left=Math.min(...units.map(u=>u.x-85*(u.nativeScale||.4)))-48;
 const right=Math.max(...units.map(u=>u.x+85*(u.nativeScale||.4)))+48;
 const top=Math.min(...units.map(u=>u.y*.58+75-155*(u.nativeScale||.4)))-55;
 const bottom=Math.max(...units.map(u=>u.y*.58+75))+75;
 const fit=Math.min(width/(right-left),height/(bottom-top));
 const scale=Math.min(fit,Math.max(width<600?1.35:1.85,width/1002));
 const target={scale,x:(left+right-width/scale)/2,y:(top+bottom-height/scale)/2};
 const old=battle.viewCamera||(!battle.reducedMotion?{...arenaCamera(width,height),viewportWidth:width,viewportHeight:height,updatedAt:time-1/60}:null),same=old?.viewportWidth===width&&old.viewportHeight===height;
 // Expand immediately to retain every silhouette; ease inward without chasing
 // individual strides. Reduced motion retains a stable encounter-wide frame.
 const dt=same?Math.max(0,Math.min(.1,time-old.updatedAt)):0;
 const blend=same?1-Math.exp(-dt*2):1;
 let nextScale=same?Math.min(scale,old.scale+(scale-old.scale)*blend):scale;
 let x=same?old.x+(target.x-old.x)*blend:target.x,y=same?old.y+(target.y-old.y)*blend:target.y;
 if(battle.reducedMotion&&same){nextScale=Math.min(old.scale,scale);x=old.x;y=old.y;}
 // Clamp the eased centre so a dash cannot run outside the current frame.
 x=Math.max(right-width/nextScale,Math.min(left,x));y=Math.max(bottom-height/nextScale,Math.min(top,y));
 if(width/nextScale<=1002)x=Math.max(0,Math.min(1002-width/nextScale,x));
 if(height/nextScale<=654)y=Math.max(0,Math.min(654-height/nextScale,y));
 return battle.viewCamera={scale:nextScale,x,y,width:width/nextScale,height:height/nextScale,viewportWidth:width,viewportHeight:height,updatedAt:time};
}
