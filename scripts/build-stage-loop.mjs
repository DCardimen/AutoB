// Close the motion path by blending the tail into the opening second, then
// start after that opening second. The final image continues into frame zero.
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const source=process.argv[2];if(!source)throw Error('Usage: node scripts/build-stage-loop.mjs <source.mp4> [output.mp4] (FFMPEG_PATH selects ffmpeg)');
const output=process.argv[3]||'public/ui/uploaded/stage-grasslands.mp4';
if(path.resolve(source)===path.resolve(output))throw Error('Use a separate source file so the original is preserved.');
fs.mkdirSync(path.dirname(output),{recursive:true});
const temporary=output+'.working.mp4';
const filter='[0:v]scale=720:1280:flags=lanczos,setsar=1,split=2[whole][head];[whole]trim=start=1:end=8,setpts=PTS-STARTPTS,fps=24,settb=1/24[main];[head]trim=start=0:end=1,setpts=PTS-STARTPTS,fps=24,settb=1/24[begin];[main][begin]xfade=transition=fade:duration=1:offset=6,format=yuv420p[loop]';
const result=spawnSync(process.env.FFMPEG_PATH||'ffmpeg',['-y','-i',source,'-filter_complex',filter,'-map','[loop]','-an','-c:v','libx264','-preset','slow','-crf','27','-g','168','-keyint_min','168','-sc_threshold','0','-movflags','+faststart',temporary],{stdio:'inherit'});
if(result.error)throw result.error;if(result.status!==0)process.exit(result.status||1);
fs.renameSync(temporary,output);
console.log('Continuous seven-second stage loop:',output,fs.statSync(output).size,'bytes');
