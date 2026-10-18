import fs from 'node:fs';
import assert from 'node:assert/strict';
import {decodePng} from './animation-artifacts.mjs';
const folder='public/melee-layer-review/layers';let frames=0,images=0,original=0,backing=0;
for(const file of fs.readdirSync('art/melee-layers/masters')){
 const m=JSON.parse(fs.readFileSync('art/melee-layers/masters/'+file,'utf8')),names=['bind','backing',...Object.keys(m.facings[0].layers)],decoded=Object.fromEntries(names.map(n=>{const a=decodePng(fs.readFileSync(`${folder}/${m.identity}-${m.stage}-${n}.png`));assert.equal(a.width,512);assert.equal(a.height,64);images++;return [n,a.rgba];}));
 const read=(name,dir,x,y)=>[...decoded[name].subarray((y*512+dir*64+x)*4,(y*512+dir*64+x)*4+4)];
 for(const f of m.facings){frames++;
  for(const [n,owner]of f.ownership){const index=parseInt(f.original.slice(n*2,n*2+2),16),expected=m.palette[index].match(/../g).map(v=>parseInt(v,16)).concat(255);assert.deepEqual(read(owner,f.dir,n%64,Math.floor(n/64)),expected,'actual decoded owner texture');assert.deepEqual(read('bind',f.dir,n%64,Math.floor(n/64)),expected,'actual frozen bind pixels');original++;}
  const [ox,oy]=f.backing.origin;f.backing.rows.forEach((row,y)=>{for(let x=0;x<row.length/2;x++){const index=parseInt(row.slice(x*2,x*2+2),16);if(index){assert.deepEqual(read('backing',f.dir,x+ox,y+oy),m.palette[index].match(/../g).map(v=>parseInt(v,16)).concat(255));backing++;}}});
  for(const data of Object.values(decoded))for(let y=0;y<64;y++)for(let x=0;x<64;x++){const rgba=[...data.subarray((y*512+f.dir*64+x)*4,(y*512+f.dir*64+x)*4+4)];assert.ok(rgba[3]===0||rgba[3]===255);if(rgba[3])assert.ok(m.palette.includes(Buffer.from(rgba.slice(0,3)).toString('hex')),'actual PNG retains original material palette');}
 }
}assert.equal(frames,168);const report={status:'passed',frames,images,originalSourcePixels:original,independentBackingPixels:backing,palette:'Original indexed materials only',verification:'Independent PNG checksum, decode, owner texture, backing and palette checks'};fs.writeFileSync('public/melee-layer-review/checks/decoded-layers.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
