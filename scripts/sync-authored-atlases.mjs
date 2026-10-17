import fs from 'node:fs';
import {png} from './animation-artifacts.mjs';
for(const [group,stage]of [['body',2],['family',1],['family',2]]){
 const atlas=Object.values(await import(`../authored-${group}-stage${stage}-data.js`))[0],entries=Object.values(atlas),width=512,height=entries.length*64,rgba=new Uint8ClampedArray(width*height*4);
 entries.forEach((a,row)=>a.frames.forEach((hex,dir)=>{const colors=a.palette.map(c=>c.match(/../g).map(v=>parseInt(v,16)));for(let i=0;i<4096;i++){const n=parseInt(hex.slice(i*2,i*2+2),16);if(n)rgba.set([...colors[n],255],((row*64+Math.floor(i/64))*width+dir*64+i%64)*4);}}));
 fs.writeFileSync(`public/authored-${group}-stage${stage}-idles.png`,png(width,height,rgba));
}
console.log('Synced the three repaired indexed atlases without resampling or changing palettes.');
