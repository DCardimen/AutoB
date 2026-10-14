const factor=(tuning,id)=>(tuning?.[id]??100)/100;
export function movementPace(distance,stamina,tuning,allowSprint=true){
 const run=180*factor(tuning,'runStartDistance'),sprint=Math.max(run+40,320*factor(tuning,'sprintStartDistance'));
 return allowSprint&&distance>sprint&&stamina>55?2.15:distance>run?1.65:1;
}
// Shared by combat and the settings examples, so previews demonstrate the
// actual acceleration, braking, cornering and steering rules.
export function steerMovement(velocityX,velocityY,vx,vy,movement,enabled,dt,tuning){
 const length=Math.hypot(vx,vy);if(length>1){vx/=length;vy/=length;}
 const previous=Math.hypot(velocityX,velocityY),turn=previous>8&&length>.1?Math.abs(Math.atan2(Math.sin(Math.atan2(vy,vx)-Math.atan2(velocityY,velocityX)),Math.cos(Math.atan2(vy,vx)-Math.atan2(velocityY,velocityX)))):0;
 const corner=1-Math.min(.9,.3*factor(tuning,'cornerSlowdown'))*Math.sin(Math.min(Math.PI/2,turn));
 const tx=vx*movement*enabled*corner,ty=vy*movement*enabled*corner,dx=tx-velocityX,dy=ty-velocityY,change=Math.hypot(dx,dy);
 const steering=1+Math.min(1,turn/(Math.PI/2))*(factor(tuning,'steeringAgility')-1);
 const limit=(Math.hypot(tx,ty)<previous?600*factor(tuning,'braking'):390*factor(tuning,'acceleration'))*dt*steering,blend=Math.min(1,limit/(change||1));
 return {x:velocityX+dx*blend,y:velocityY+dy*blend};
}
