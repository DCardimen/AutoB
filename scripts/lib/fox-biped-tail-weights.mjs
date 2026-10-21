import {execFileSync} from 'node:child_process';

export function repairBipedTailWeights(glb,sourceFile){
 const {json:g,read,append}=glb,p=g.meshes[0].primitives[0],positions=read(p.attributes.POSITION),uv=read(p.attributes.TEXCOORD_0),j=Uint16Array.from(read(p.attributes.JOINTS_0)),w=Float32Array.from(read(p.attributes.WEIGHTS_0)),names=g.skins[0].joints.map(id=>g.nodes[id].name),hip=names.indexOf('smartrigHips'),tail=id=>/^Bone_01[5-9]$/.test(names[id]);
 const eligible=[];for(let i=0;i<w.length/4;i++)if([0,1,2,3].some(k=>tail(j[i*4+k])&&w[i*4+k]>.00001))eligible.push(i);
 const colors=JSON.parse(execFileSync('python',['scripts/lib/sample-glb-texture.py'],{input:JSON.stringify({file:sourceFile,uvs:eligible.map(i=>[uv[i*2],uv[i*2+1]])}),maxBuffer:32*1024*1024}));
 let repaired=0,fur=0,costume=0,rearBeltVertices=0;const attachment=[];
 for(const [n,i]of eligible.entries()){
  const weights=new Map();let tailSum=0;for(let k=0;k<4;k++)if(tail(j[i*4+k]))tailSum+=w[i*4+k];
  const [r,gr,b]=colors.slice(n*3,n*3+3),green=gr>r*1.12&&gr>b&&gr>35,gold=r>140&&gr>105&&b<gr*.78&&r<gr*1.45&&positions[i*3+1]<-.085,orange=r>gr*1.45&&r>b*1.7;
  const rearLeather=r<130&&gr<100&&b<80&&r>gr*1.12&&r>b*1.5&&Math.abs(positions[i*3])<.11&&positions[i*3+1]>-.15&&positions[i*3+1]<-.085&&positions[i*3+2]>.29&&positions[i*3+2]<.46;
  if(tailSum>.05&&tailSum<.95&&Math.hypot(positions[i*3]-.0021484,positions[i*3+1]+.118164,positions[i*3+2]-.358789)<.045)attachment.push(i);
  // Source coordinates: Y points backward, Z points up. Sample the authored
  // fur/costume texture rather than swallowing the adjacent green/gold hem.
  const completeFur=!green&&!gold&&!rearLeather&&(tailSum>.5||(orange&&Math.abs(positions[i*3])<.06&&positions[i*3+1]>-.13&&positions[i*3+2]>.29));
  const rearBelt=rearLeather||(green||gold)&&Math.abs(positions[i*3])<.11&&positions[i*3+1]>-.13&&positions[i*3+2]>.29&&positions[i*3+2]<.46;
  if(rearBelt)rearBeltVertices++;
  for(let k=0;k<4;k++){
   let id=j[i*4+k],weight=w[i*4+k];
   if(rearBelt)id=hip;
   else if(completeFur){if(!tail(id))id=hip;}
   else if(tail(id))id=hip;
   weights.set(id,(weights.get(id)||0)+weight);
  }
  const list=[...weights].filter(([,v])=>v>1e-8),sum=list.reduce((s,[,v])=>s+v,0);
  if(!sum)throw Error(`Empty biped weights at ${i}`);
  for(let k=0;k<4;k++){const value=(list[k]?.[1]||0)/sum,id=list[k]?.[0]||0;if(Math.abs(w[i*4+k]-value)>1e-6||j[i*4+k]!==id)repaired++;j[i*4+k]=id;w[i*4+k]=value;}
  if(completeFur)fur++;else costume++;
 }
 p.attributes.JOINTS_0=append(j,'VEC4',5123,34962);p.attributes.WEIGHTS_0=append(w,'VEC4',5126,34962);
 g.meshes[0].extras={...g.meshes[0].extras,tailAttachmentVertices:attachment};
 return {affectedInfluences:repaired,tailFurVertices:fur,pelvisSeamVertices:costume,rearBeltVertices,attachmentVertices:attachment.length,method:'Original texture separates orange/cream fur from green/gold cloth and brown rear leather. Tail fur retains its source tail/pelvis blend, with thigh influence transferred to pelvis. Tail influence on costume transfers to pelvis; the rear belt and leather panel are pelvis-bound. Original mixed-weight attachment within 45 mm of the authored socket is the connected seam, excluded from surface collision only. All triangles remain visible. No positions, normals, UVs or textures changed.'};
}
