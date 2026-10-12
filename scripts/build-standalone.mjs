import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.png':'image/png','.woff2':'font/woff2'};
const asset=file=>'data:'+mime[path.extname(file)]+';base64,'+fs.readFileSync(path.join(root,file)).toString('base64');
const atlasNames=['prototype-glade-pixel'];
const assets=Object.fromEntries(atlasNames.map(name=>[name+'.png',asset('public/'+name+'.png')]));
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8').replace(/url\("(\/public\/[^"\)]+)"\)/g,(_,file)=>'url("'+asset(file.slice(1))+'")');
const bundle=await build({entryPoints:[path.join(root,'app.js')],bundle:true,write:false,format:'iife',target:'es2020',plugins:[{name:'offline-art',setup(b){b.onLoad({filter:/(?:art|native-art)\.js$/},args=>{
 let contents=fs.readFileSync(args.path,'utf8').replace("backdrop.src='/public/prototype-glade-pixel.png';",'backdrop.src=embeddedAssets["prototype-glade-pixel.png"];');return {contents,loader:'js',resolveDir:path.dirname(args.path)};
});}}]});
const js='const embeddedAssets='+JSON.stringify(assets)+';\n'+bundle.outputFiles[0].text;
new vm.Script(js);if(/<\/script/i.test(js))throw new Error('Unsafe script embedding');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<link rel="stylesheet" href="styles.css" />','<style>'+css+'</style>').replace('<script type="module" src="app.js"></script>','<script>'+js+'</script>').replace('href="prototype.html"','href="Starfall-Training-Glade.html"');
fs.writeFileSync(path.join(root,'Starfall-Menagerie.html'),html);
console.log('Built native-compatible standalone: '+(Buffer.byteLength(html)/1024/1024).toFixed(1)+' MiB, embedded artwork and fonts.');
