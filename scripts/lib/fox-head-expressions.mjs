import * as T from 'three';

const smooth=(a,b,x)=>{const t=T.MathUtils.clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
// Landmarks inspected on the uploaded mesh: ear roots above the cheek/temple;
// black nose vertices occupy x=-.04..+.044, y=1.009..1.061, z=.369..383.
export function headExpressionDeltas(points,normals){
 const targets=[];
 for(let target=0;target<3;target++){
  const p=new Float32Array(points.length*3),n=new Float32Array(points.length*3);
  points.forEach((source,i)=>{
   const v=source.clone(),normal=new T.Vector3().fromArray(normals,i*3);
   if(target<2){
    const sign=target===0?-1:1;
    const weight=smooth(1.32,1.43,v.y)*smooth(.105,.18,sign*v.x);
    const pivot=new T.Vector3(sign*.215,1.335,.035);
    const q=new T.Quaternion().setFromEuler(new T.Euler(-.055*weight,sign*.09*weight,-sign*.16*weight));
    v.sub(pivot).applyQuaternion(q).add(pivot);normal.applyQuaternion(q);
   }else{
    const radius=Math.hypot(v.x/.072,(v.y-1.038)/.065,(v.z-.378)/.080);
    const weight=1-smooth(.40,1,radius);
    v.y+=.0020*weight;v.z+=.0035*weight;
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
