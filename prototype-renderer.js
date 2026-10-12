import {paintCharacterPixels,CELL,PIVOT,PIXEL_WORLD} from './prototype-pixel-art.js';
let queue=null,lastCalls=0;
export function initializeCharacterRenderer(){return true;}
export function renderCharacterFrame(id,rig,angle){const canvas=document.createElement('canvas');canvas.width=CELL;canvas.height=CELL;const pixels=paintCharacterPixels(id,rig,angle);canvas.getContext('2d').putImageData(new ImageData(pixels,CELL,CELL),0,0);let top=CELL;rows:for(let y=0;y<CELL;y++)for(let x=0;x<CELL;x++)if(pixels[(y*CELL+x)*4+3]){top=y;break rows;}canvas.spriteTop=top;return canvas;}
export function beginCharacterFrame(){queue=[];}
export function queueCharacter(id,rig,angle,x,y,scale,transform){if(queue===null)return false;queue.push({id,rig,angle,x:transform.a*x+transform.c*y+transform.e,y:transform.b*x+transform.d*y+transform.f,scale:scale*transform.a});return true;}
export function flushCharacterFrame(c){if(queue===null)return;lastCalls=queue.length;c.save();c.resetTransform();c.imageSmoothingEnabled=false;for(const u of queue){const frame=renderCharacterFrame(u.id,u.rig,u.angle),scale=PIXEL_WORLD*u.scale;c.drawImage(frame,Math.round(u.x-PIVOT.x*scale),Math.round(u.y-PIVOT.y*scale),CELL*scale,CELL*scale);}c.restore();queue=null;}
export function characterRendererStats(){return {type:'Canvas2D',artStyle:'native 64x64 pixel chibi',nativeArena:[334,218],nativePortrait:[64,64],nearestNeighbor:true,antialias:false,facings:8,arenaPasses:1,drawCalls:lastCalls};}
