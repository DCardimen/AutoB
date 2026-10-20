import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';

// Encodes JPEG frames at a fixed rate into VP8 WebM. Headless software
// rendering is slower than real time, so reviews render each frame at its exact
// animation time and encode offline; the video then plays at true speed.
// Playwright's bundled ffmpeg reads only files, so frames are staged in one
// MJPEG stream file first.
export function webmWriter(output,{fps=30,bitrate='4M'}={}){
 const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'fox-webm-')),stream=path.join(scratch,'frames.mjpeg'),file=fs.openSync(stream,'w');let frames=0;
 return {
  write(jpeg){fs.writeSync(file,jpeg);frames++;},
  async finish(){
   fs.closeSync(file);
   const ffmpeg=process.env.FFMPEG_PATH||path.join(os.homedir(),'.cache/ms-playwright/ffmpeg-1011',process.platform==='win32'?'ffmpeg-win64.exe':'ffmpeg-linux');
   try{await new Promise((resolve,reject)=>{const encoder=spawn(ffmpeg,['-y','-loglevel','error','-f','image2pipe','-c:v','mjpeg','-framerate',String(fps),'-i',stream,'-c:v','libvpx','-b:v',bitrate,'-pix_fmt','yuv420p',output],{stdio:'inherit'});encoder.on('close',code=>code?reject(Error('ffmpeg exited '+code)):resolve());encoder.on('error',reject);});}
   finally{fs.rmSync(scratch,{recursive:true,force:true});}
   return {frames,seconds:frames/fps};
  },
 };
}
