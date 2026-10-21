import * as T from 'three';

const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
export const HEAD_TARGETS=['Ear_Right','Ear_Left','Nose_Sniff','Brow_Angry','Ears_Back'];
// Landmarks inspected on the uploaded mesh: ear roots above the cheek/temple;
// black nose vertices occupy x=-.04..+.044, y=1.009..1.061, z=.369..383; the
// white brow marks sit above the inner half of each eye (x=±.10..±.14,
// y=1.23..1.255) and the eye sockets end at y=1.205.
export function headExpressionDeltas(points,normals){
 const targets=[];
 const ear=(v,normal,sign,euler)=>{const weight=smooth(1.32,1.43,v.y)*smooth(.105,.18,sign*v.x);const pivot=new T.Vector3(sign*.215,1.335,.035),q=new T.Quaternion().setFromEuler(new T.Euler(...euler.map(a=>a*weight)));v.sub(pivot).applyQuaternion(q).add(pivot);normal.applyQuaternion(q);};
 for(let target=0;target<HEAD_TARGETS.length;target++){
  const p=new Float32Array(points.length*3),n=new Float32Array(points.length*3);
  points.forEach((source,i)=>{
   const v=source.clone(),normal=new T.Vector3().fromArray(normals,i*3);
   if(target<2){const sign=target===0?-1:1;ear(v,normal,sign,[-.055,sign*.09,-sign*.16]);}
   else if(target===2){
    const radius=Math.hypot(v.x/.072,(v.y-1.038)/.065,(v.z-.378)/.080);
    const weight=1-smooth(.40,1,radius);
    v.y+=.0020*weight;v.z+=.0035*weight;
   }else if(target===3){
    // Angry brows: the fur over each eye presses down, most at the inner
    // end, and draws toward the nose. Nothing below the socket edge moves.
    const sign=Math.sign(v.x)||1,dx=sign*v.x-.125,dy=v.y-1.245;
    const weight=(1-smooth(.45,1,Math.hypot(dx/.085,dy/.055)))*smooth(1.205,1.224,v.y)*smooth(.15,.22,v.z);
    v.y-=.016*weight*(1-.55*smooth(-.04,.05,dx));v.x-=sign*.007*weight;v.z+=.003*weight;
   }else{
    // Ears pinned back and out, as in a fox's warning posture.
    for(const sign of [-1,1])ear(v,normal,sign,[-.34,sign*.05,-sign*.20]);
   }
   v.sub(source).toArray(p,i*3);normal.sub(new T.Vector3().fromArray(normals,i*3)).toArray(n,i*3);
  });
  targets.push({position:p,normal:n});
 }
 return targets;
}

export function registerHeadExpressions(glb,sourcePoints,normals){
 return headExpressionDeltas(sourcePoints,normals).map(t=>({POSITION:glb.append(t.position,'VEC3',5126,34962),NORMAL:glb.append(t.normal,'VEC3',5126,34962)}));
}
