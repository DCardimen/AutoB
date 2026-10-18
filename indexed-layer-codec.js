// Small synchronous lossless decoder, shared by source and offline builds.
// Palette pixels and ownership masks are packed; no image is resampled.
export function decodeLayerData(encoded){
 const raw=atob(encoded),chunks=[];let dictionary=Array.from({length:256},(_,i)=>String.fromCharCode(i)),next=257,previous='';
 if(raw.length%2)throw Error('Truncated indexed layer data');
 for(let i=0;i<raw.length;i+=2){const code=raw.charCodeAt(i)|raw.charCodeAt(i+1)<<8;if(code===256){dictionary=Array.from({length:256},(_,i)=>String.fromCharCode(i));next=257;previous='';continue;}
  const entry=dictionary[code]??(code===next&&previous?previous+previous[0]:null);if(entry===null)throw Error('Invalid indexed layer dictionary');chunks.push(entry);if(previous)dictionary[next++]=previous+entry[0];previous=entry;
 }return JSON.parse(chunks.join(''));
}
const alphabet='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
export const INDEXED_LAYER_NAMES=['cape-back','body','left-leg','right-leg','armor','head','cape-front','left-arm','right-arm','weapon','ground'];
export function decodeIndexedGrid(layer){
 const {origin:[ox,oy],width,height,rle}=layer,result=new Map();let n=0;
 if(rle.length%2)throw Error('Truncated indexed grid');
 for(let i=0;i<rle.length;i+=2){const count=alphabet.indexOf(rle[i])+1,index=alphabet.indexOf(rle[i+1]);if(count<1||index<0||n+count>width*height)throw Error('Invalid indexed grid run');if(index)for(let j=0;j<count;j++){const position=n+j;result.set((oy+Math.floor(position/width))*64+ox+position%width,index);}n+=count;}
 if(n!==width*height)throw Error('Incomplete indexed grid');return result;
}
