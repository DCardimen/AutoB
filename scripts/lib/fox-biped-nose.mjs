export function addBipedNose(glb){
 const {json:g,read,append}=glb,p=g.meshes[0].primitives[0],positions=read(p.attributes.POSITION),right=new Float32Array(positions.length),left=new Float32Array(positions.length);
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};let count=0;
 for(let i=0;i<positions.length;i+=3){const [x,back,up]=positions.slice(i,i+3),mask=(1-smooth(.025,.038,Math.abs(x)))*smooth(-.361,-.386,back)*smooth(.660,.674,up)*(1-smooth(.697,.709,up));if(mask<=0)continue;
  right[i]=.007*mask;left[i]=-.007*mask;right[i+2]=left[i+2]=.0028*mask;count++;
 }
 p.targets=[{POSITION:append(right,'VEC3',5126,34962)},{POSITION:append(left,'VEC3',5126,34962)}];g.meshes[0].weights=[0,0];g.meshes[0].extras={...g.meshes[0].extras,targetNames:['Nose_Twitch_Right','Nose_Twitch_Left']};
 return {vertices:count,sideways:.007,lift:.0028,forward:0,mouthUnchangedBelow:.660,method:'Nose pad and immediately attached fur only; no forward extension and no mouth displacement.'};
}
