import {build} from 'esbuild';
import fs from 'node:fs';
const bundlePath='public/meshy-fox-preview/viewer.bundle.js';
const result=await build({entryPoints:['public/meshy-fox-preview/viewer.mjs'],bundle:true,format:'esm',minify:true,outfile:bundlePath,write:false});
// Three.js includes multiline shader strings with incidental trailing spaces.
fs.writeFileSync(bundlePath,result.outputFiles[0].text.replace(/[ \t]+$/gm,'').trimEnd()+'\n');
const video='docs/evidence/meshy-fox-rig/tail.webm';
if(fs.existsSync(video)){
  const fragment=fs.readFileSync('public/meshy-fox-preview/inline.template.html','utf8').replace('{{TAIL_VIDEO}}',fs.readFileSync(video).toString('base64'));
  if(Buffer.byteLength(fragment)>1000000)throw Error('Inline preview exceeds 1 MB');
  fs.writeFileSync('public/meshy-fox-preview/tail-review.html',fragment);
}
