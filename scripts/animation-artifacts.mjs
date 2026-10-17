import {deflateSync,inflateSync} from 'node:zlib';
import assert from 'node:assert/strict';
const crcTable=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);let crc=0xffffffff;for(const n of Buffer.concat([name,data]))crc=crcTable[(crc^n)&255]^(crc>>>8);sum.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([length,name,data,sum]);}
export function png(width,height,rgba){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const raw=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(rgba.buffer,rgba.byteOffset+y*width*4,width*4).copy(raw,y*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);}

// Read our deterministic RGBA exports independently of their JSON manifest.
// Reject corruption, truncation and unsupported encodings instead of grading
// metadata for an image that was never decoded.
export function decodePng(bytes){
 assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10]);
 let offset=8,width,height,ended=false;const data=[];
 while(offset<bytes.length){
  const length=bytes.readUInt32BE(offset),type=bytes.toString('ascii',offset+4,offset+8),end=offset+8+length;
  assert.ok(end+4<=bytes.length,'complete PNG chunk');
  let crc=0xffffffff;for(const n of bytes.subarray(offset+4,end))crc=crcTable[(crc^n)&255]^(crc>>>8);
  assert.equal(bytes.readUInt32BE(end),(crc^0xffffffff)>>>0,'PNG checksum');
  if(type==='IHDR'){width=bytes.readUInt32BE(offset+8);height=bytes.readUInt32BE(offset+12);assert.deepEqual([...bytes.subarray(offset+16,end)],[8,6,0,0,0]);}
  if(type==='IDAT')data.push(bytes.subarray(offset+8,end));
  offset=end+4;if(type==='IEND'){ended=true;break;}
 }
 assert.ok(ended&&width&&height&&offset===bytes.length,'complete RGBA PNG');
 const raw=inflateSync(Buffer.concat(data)),rgba=new Uint8ClampedArray(width*height*4);assert.equal(raw.length,height*(width*4+1));
 for(let y=0;y<height;y++){assert.equal(raw[y*(width*4+1)],0,'export uses filter zero');rgba.set(raw.subarray(y*(width*4+1)+1,(y+1)*(width*4+1)),y*width*4);}
 return {width,height,rgba};
}
