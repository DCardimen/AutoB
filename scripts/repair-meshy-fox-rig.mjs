import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {Matrix4,Quaternion,Euler} from 'three';
import {rigRotations} from '../public/meshy-fox-preview/rig-motion.mjs';

// A model-specific skin repair. Positions, topology, normals, UVs and embedded
// textures remain byte-for-byte in the original BIN chunk; only rig data changes.
const input=path.resolve(process.argv[2]||'C:/Users/David Cardimen/Downloads/Meshy_AI_Character_output.glb');
const output=path.resolve(process.argv[3]||'public/meshy-fox-preview/fox-repaired.glb');
const source=fs.readFileSync(input),jsonLength=source.readUInt32LE(12);
const sourceSHA256=crypto.createHash('sha256').update(source).digest('hex');
if(sourceSHA256!=='a8b9f02c6eb810e26b02c0e46b43cbb38e1983b65fc3a8b16c6fafbab8f5bbd0')throw Error('This anatomy fit is specific to the supplied Meshy fox. Inspect and fit other models independently.');
const gltf=JSON.parse(source.subarray(20,20+jsonLength)),oldBin=source.subarray(28+jsonLength,28+jsonLength+source.readUInt32LE(20+jsonLength));
if(gltf.meshes.length!==1||gltf.meshes[0].primitives.length!==1)throw Error('This repair is fitted to the supplied single fox mesh only.');
const primitive=gltf.meshes[0].primitives[0];
function accessor(id){const a=gltf.accessors[id],v=gltf.bufferViews[a.bufferView];if(v.byteStride)throw Error('Interleaved input unsupported');const C=({5126:Float32Array,5123:Uint16Array,5121:Uint8Array})[a.componentType];return new C(oldBin.buffer,oldBin.byteOffset+(v.byteOffset||0)+(a.byteOffset||0),a.count*({SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16})[a.type]);}
const positions=accessor(primitive.attributes.POSITION),count=positions.length/3;
const specs=[['Root',null,[0,0,0]],['Pelvis','Root',[0,.52,.035]],['Spine','Pelvis',[0,.65,.035]],['Chest','Spine',[0,.81,.035]],['Neck','Chest',[0,.925,.045]],['Head','Neck',[0,1.015,.06]]];
for(const [side,sign]of [['R',-1],['L',1]]){
  specs.push([`Clavicle_${side}`,'Chest',[sign*.14,.85,.035]],[`UpperArm_${side}`,`Clavicle_${side}`,[sign*.275,.84,.035]],[`Forearm_${side}`,`UpperArm_${side}`,[sign*.445,.84,.035]],[`Hand_${side}`,`Forearm_${side}`,[sign*.635,.84,.025]],
    [`Thigh_${side}`,'Pelvis',[sign*.145,.46,.025]],[`Shin_${side}`,`Thigh_${side}`,[sign*.17,.285,.025]],[`Foot_${side}`,`Shin_${side}`,[sign*.195,.125,.035]],[`Toe_${side}`,`Foot_${side}`,[sign*.21,.045,.13]]);
}
const tailPoints=[[.035,.515,-.115],[.13,.50,-.20],[.265,.475,-.25],[.405,.47,-.27],[.54,.485,-.27],[.675,.49,-.26]];
tailPoints.forEach((p,i)=>specs.push([`Tail_${String(i).padStart(2,'0')}`,i?`Tail_${String(i-1).padStart(2,'0')}`:'Pelvis',p]));
const ids=new Map(specs.map(([name],i)=>[name,i]));
const nodes=[{name:'FoxRepairArmature',children:[2]},{name:'FoxMesh',mesh:0,skin:0},...specs.map(([name,parent,p])=>({name,translation:p.map((x,k)=>x-(parent?specs[ids.get(parent)][2][k]:0)),children:[]}))];
specs.forEach(([name,parent],i)=>{if(parent)nodes[ids.get(parent)+2].children.push(i+2);});
nodes.forEach(n=>{if(n.children&&!n.children.length)delete n.children;});
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
const mix=(a,b,t)=>{const m=new Map();for(const [k,v]of a)m.set(k,(m.get(k)||0)+v*(1-t));for(const [k,v]of b)m.set(k,(m.get(k)||0)+v*t);return [...m];};
const one=name=>[[ids.get(name),1]];
const blend=(a,b,t)=>mix(one(a),one(b),t);
const skinIndices=new Uint16Array(count*4),skinWeights=new Float32Array(count*4),tailMask=new Float32Array(count);
const regionCounts={head:0,arms:0,legs:0,body:0,tail:0};
function tailWeights(x,y,z){
  const eligible=y>.275&&y<.595+.095*smooth(.19,.31,x)&&z<-.075&&x>.025;
  if(!eligible)return {weight:0,weights:[]};
  // The tail is swept sideways in the source; x is its monotonic centerline
  // coordinate. Restrict the root to the actual rear surface, clear of skirt.
  const weight=smooth(.025,.12,x)*smooth(-.105,-.155,z);
  let i=0;while(i<tailPoints.length-2&&x>tailPoints[i+1][0])i++;
  const t=smooth(tailPoints[i][0],tailPoints[i+1][0],x);
  return {weight,weights:blend(`Tail_${String(i).padStart(2,'0')}`,`Tail_${String(i+1).padStart(2,'0')}`,t)};
}
for(let i=0;i<count;i++){
  const [x,y,z]=positions.subarray(i*3,i*3+3),ax=Math.abs(x),side=x<0?'R':'L';let weights;
  if(y>=.99){weights=one('Head');regionCounts.head++;}
  else if(y>.91&&ax<.32){weights=blend('Neck','Head',smooth(.91,.99,y));regionCounts.head++;}
  else {
    weights=y<.57?one('Pelvis'):y<.72?blend('Pelvis','Spine',smooth(.57,.69,y)):blend('Spine','Chest',smooth(.69,.81,y));
    if(y>.85)weights=mix(weights,one('Neck'),smooth(.85,.94,y));
    // Arm support is confined to the arm's actual horizontal band, preventing
    // the source's shoulder/forearm weights from pulling ears or the tail.
    const armGate=smooth(.215,.285,ax)*(1-smooth(.925,.99,y))*smooth(.70,.775,y);
    if(armGate>0){
      const arm=ax<.31?blend(`Clavicle_${side}`,`UpperArm_${side}`,smooth(.22,.31,ax)):ax<.50?blend(`UpperArm_${side}`,`Forearm_${side}`,smooth(.405,.485,ax)):blend(`Forearm_${side}`,`Hand_${side}`,smooth(.60,.66,ax));
      weights=mix(weights,arm,armGate);regionCounts.arms++;
    }else regionCounts.body++;
    if(y<.48){
      const leg=y>.31?blend(`Thigh_${side}`,`Shin_${side}`,1-smooth(.245,.335,y)):y>.125?blend(`Shin_${side}`,`Foot_${side}`,1-smooth(.105,.16,y)):one(`Foot_${side}`);
      // The skirt stays pelvis-bound. Visible thighs emerge below its hem.
      weights=mix(weights,leg,1-smooth(.35,.445,y));regionCounts.legs++;
    }
    const tail=tailWeights(x,y,z);tailMask[i]=tail.weight;
    if(tail.weight>0){weights=mix(weights,tail.weights,tail.weight);regionCounts.tail++;}
  }
  weights=weights.filter(([,w])=>w>1e-7).sort((a,b)=>b[1]-a[1]).slice(0,4);const sum=weights.reduce((s,[,w])=>s+w,0);
  weights.forEach(([id,w],k)=>{skinIndices[i*4+k]=id;skinWeights[i*4+k]=w/sum;});
}
const originalRig={nodes:gltf.nodes,skins:gltf.skins,scenes:gltf.scenes,scene:gltf.scene,attributes:{...primitive.attributes}};
let binary=Buffer.from(oldBin);
function append(array,type,componentType,count){const padding=(4-binary.length%4)%4;const offset=binary.length+padding;const bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength);binary=Buffer.concat([binary,Buffer.alloc(padding),bytes]);const view=gltf.bufferViews.push({buffer:0,byteOffset:offset,byteLength:bytes.length})-1;return gltf.accessors.push({bufferView:view,componentType,count,type})-1;}
primitive.attributes.JOINTS_0=append(skinIndices,'VEC4',5123,count);primitive.attributes.WEIGHTS_0=append(skinWeights,'VEC4',5126,count);
for(const id of [primitive.attributes.JOINTS_0,primitive.attributes.WEIGHTS_0])gltf.bufferViews[gltf.accessors[id].bufferView].target=34962;
const inverseBinds=new Float32Array(specs.length*16);specs.forEach(([, ,p],i)=>new Matrix4().makeTranslation(...p).invert().toArray(inverseBinds,i*16));
gltf.skins=[{name:'FoxAnatomyRig',skeleton:2,joints:specs.map((_,i)=>i+2),inverseBindMatrices:append(inverseBinds,'MAT4',5126,specs.length)}];
gltf.nodes=nodes;gltf.scenes=[{name:'Fox repair preview',nodes:[0,1]}];gltf.scene=0;
// Embedded diagnostic clips make the rig independently inspectable in a DCC.
const times=Float32Array.from({length:121},(_,i)=>i/30),timeId=append(times,'SCALAR',5126,times.length);
gltf.accessors[timeId].min=[0];gltf.accessors[timeId].max=[4];
gltf.animations=['tail','joints'].map(mode=>{
  const animation={name:mode==='tail'?'Relaxed_Tail_Sway_Preview':'Joint_Check_Preview',samplers:[],channels:[]};
  specs.forEach(([name],bone)=>{
    if(!rigRotations(mode,0)[name])return;
    const values=new Float32Array(times.length*4);
    times.forEach((t,i)=>new Quaternion().setFromEuler(new Euler(...rigRotations(mode,t)[name])).toArray(values,i*4));
    const sampler=animation.samplers.push({input:timeId,output:append(values,'VEC4',5126,times.length),interpolation:'LINEAR'})-1;
    animation.channels.push({sampler,target:{node:bone+2,path:'rotation'}});
  });return animation;
});
gltf.extras={...gltf.extras,foxRigRepair:{sourceSHA256,originalRig,tailPoints,scope:'Base fox only. Anatomy and tail skin repair; no custom fingers, blink, cloth simulation or archery animation.',regionCounts}};
gltf.buffers[0].byteLength=binary.length;
const json=Buffer.from(JSON.stringify(gltf)),jsonPad=Buffer.alloc((4-json.length%4)%4,32),binPad=Buffer.alloc((4-binary.length%4)%4);
const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+jsonPad.length+binary.length+binPad.length,8);header.writeUInt32LE(json.length+jsonPad.length,12);header.writeUInt32LE(0x4e4f534a,16);
const binHeader=Buffer.alloc(8);binHeader.writeUInt32LE(binary.length+binPad.length,0);binHeader.writeUInt32LE(0x004e4942,4);
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,Buffer.concat([header,json,jsonPad,binHeader,binary,binPad]));
console.log(JSON.stringify({output,bones:specs.length,vertices:count,regionCounts,sourceSHA256:gltf.extras.foxRigRepair.sourceSHA256}));
