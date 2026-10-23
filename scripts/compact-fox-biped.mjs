import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export function compactBiped(file='public/meshy-fox-preview/fox-biped.glb'){
 const bytes=fs.readFileSync(file),jsonLength=bytes.readUInt32LE(12),g=JSON.parse(bytes.subarray(20,20+jsonLength)),bin=bytes.subarray(28+jsonLength),used=new Set();
 for(const a of g.animations||[]){const ids=[...new Set(a.channels.map(c=>c.sampler))],map=new Map(ids.map((id,i)=>[id,i]));a.samplers=ids.map(id=>a.samplers[id]);for(const c of a.channels)c.sampler=map.get(c.sampler);for(const s of a.samplers){used.add(s.input);used.add(s.output)}}
 for(const mesh of g.meshes)for(const p of mesh.primitives){for(const id of Object.values(p.attributes))used.add(id);if(p.indices!==undefined)used.add(p.indices);for(const t of p.targets||[])for(const id of Object.values(t))used.add(id)}
 for(const s of g.skins||[])if(s.inverseBindMatrices!==undefined)used.add(s.inverseBindMatrices);
 const ids=[...used].sort((a,b)=>a-b),map=new Map(ids.map((id,i)=>[id,i]));g.accessors=ids.map(id=>g.accessors[id]);
 for(const mesh of g.meshes)for(const p of mesh.primitives){for(const key of Object.keys(p.attributes))p.attributes[key]=map.get(p.attributes[key]);if(p.indices!==undefined)p.indices=map.get(p.indices);for(const t of p.targets||[])for(const key of Object.keys(t))t[key]=map.get(t[key])}
 for(const a of g.animations||[])for(const s of a.samplers){s.input=map.get(s.input);s.output=map.get(s.output)}for(const s of g.skins||[])if(s.inverseBindMatrices!==undefined)s.inverseBindMatrices=map.get(s.inverseBindMatrices);
 const viewIds=[...new Set([...g.accessors.map(a=>a.bufferView),...g.images.map(i=>i.bufferView)])].sort((a,b)=>a-b),viewMap=new Map(viewIds.map((id,i)=>[id,i])),chunks=[];let size=0;
 g.bufferViews=viewIds.map(id=>{const v=g.bufferViews[id],pad=(4-size%4)%4;chunks.push(Buffer.alloc(pad));size+=pad;const offset=size,data=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);chunks.push(data);size+=data.length;return {...v,byteOffset:offset}});
 for(const a of g.accessors)a.bufferView=viewMap.get(a.bufferView);for(const im of g.images)im.bufferView=viewMap.get(im.bufferView);
 g.buffers=[{byteLength:size}];const text=Buffer.from(JSON.stringify(g)),jp=Buffer.alloc((4-text.length%4)%4,32),bp=Buffer.alloc((4-size%4)%4),h=Buffer.alloc(20),bh=Buffer.alloc(8);h.writeUInt32LE(0x46546c67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(28+text.length+jp.length+size+bp.length,8);h.writeUInt32LE(text.length+jp.length,12);h.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(size+bp.length,0);bh.writeUInt32LE(0x004e4942,4);fs.writeFileSync(file,Buffer.concat([h,text,jp,bh,...chunks,bp]));console.log('Compacted biped',bytes.length,fs.statSync(file).size);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))compactBiped();
