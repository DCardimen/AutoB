import * as T from 'three';
export function addBipedDust(glb,parent){
 const {json:g,append}=glb,mat=g.materials.push({name:'Jump ground dust',pbrMetallicRoughness:{baseColorFactor:[.59,.44,.26,.40],metallicFactor:0,roughnessFactor:1},alphaMode:'BLEND',doubleSided:true})-1,geo=new T.SphereGeometry(.018,6,4),mesh=g.meshes.push({name:'Ground impulse dust',primitives:[{attributes:{POSITION:append(geo.attributes.position.array,'VEC3',5126,34962),NORMAL:append(geo.attributes.normal.array,'VEC3',5126,34962)},indices:append(Uint16Array.from(geo.index.array),'SCALAR',5123,34963),material:mat}]})-1,names=[];
 for(let i=0;i<8;i++){const name=`Jump_Ground_Dust_${i}`,id=g.nodes.push({name,mesh,scale:[0,0,0]})-1;g.nodes[parent].children.push(id);names.push(name);}return names;
}
