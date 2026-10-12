import fs from 'node:fs';
import vm from 'node:vm';
import {build} from 'esbuild';
await build({entryPoints:['prototype.js'],bundle:true,format:'iife',target:'es2020',outfile:'public/prototype-bundle.js',legalComments:'eof'});
const notice=fs.readFileSync('node_modules/three/LICENSE','utf8');
const bundle=fs.readFileSync('public/prototype-bundle.js','utf8').replaceAll('\t','  ').replace(/[ \t]+$/gm,'')+'\n/* Three.js license\n'+notice+'*/\n';
fs.writeFileSync('public/prototype-bundle.js',bundle);
const glade='data:image/png;base64,'+fs.readFileSync('public/prototype-glade-pixel.png').toString('base64');
let js=bundle.replace('backdrop.src = "/public/prototype-glade-pixel.png"','backdrop.src = '+JSON.stringify(glade));
if(js.includes('"/public/prototype-glade-pixel.png"'))throw new Error('Unresolved background asset');
js=js.replaceAll('</script','<\\/script');new vm.Script(js);
const html=fs.readFileSync('prototype.html','utf8').replace('<link rel="stylesheet" href="prototype.css">','<style>'+fs.readFileSync('prototype.css','utf8')+'</style>')
  .replace('<script src="public/prototype-bundle.js"></script>','<script>'+js+'</script>').replaceAll('href="index.html"','href="Starfall-Menagerie.html"');
fs.writeFileSync('Starfall-Training-Glade.html',html);
console.log(`Built native-pixel Training Glade: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB, zero remote dependencies.`);
