import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.mp4':'video/mp4'};
const asset=file=>'data:'+mime[path.extname(file)]+';base64,'+fs.readFileSync(path.join(root,file)).toString('base64');
const atlasNames=['prototype-glade-pixel'];
const assets=Object.fromEntries(atlasNames.map(name=>[name+'.png',asset('public/'+name+'.png')]));
// Uploaded skin variables are installed from UI_ART's shared blob URLs.
// Do not duplicate large PNG data URLs inside CSS custom properties.
// Other CSS artwork also shares one embedded copy, including the arena icon
// atlas used by multiple selectors. Variables receive compact blob URLs.
const cssFiles=new Map(),cssAssets={};
const css=['styles.css','field-ui.css','uploaded-ui.css','journey-polish.css'].map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('\n').replace(/url\("(\/public\/[^"\)]+)"\)/g,(_,file)=>{
 if(file.startsWith('/public/ui/uploaded/'))return 'none';
 // @font-face descriptors do not inherit root custom properties.
 if(path.extname(file)==='.woff2')return 'url("'+asset(file.slice(1))+'")';
 if(!cssFiles.has(file)){const key='css-'+cssFiles.size;cssFiles.set(file,key);cssAssets[key]=asset(file.slice(1));}
 return 'var(--offline-'+cssFiles.get(file)+')';
});
const bundle=await build({entryPoints:[path.join(root,'app.js')],bundle:true,write:false,format:'iife',minifyWhitespace:true,target:'es2020',plugins:[{name:'offline-art',setup(b){b.onLoad({filter:/(?:art|native-art|field-ui|ui-art-assets)\.js$/},args=>{
 let contents=fs.readFileSync(args.path,'utf8').replace("backdrop.src='/public/prototype-glade-pixel.png';",'backdrop.src=embeddedAssets["prototype-glade-pixel.png"];');if(args.path.endsWith('ui-art-assets.js'))contents=contents.replace(/\/public\/ui\/uploaded\/[a-z0-9-]+\.(?:png|webp|mp4)/g,file=>asset(file.slice(1)));return {contents,loader:'js',resolveDir:path.dirname(args.path)};
});}}]});
const cssSetup='const embeddedCSSAssets='+JSON.stringify(cssAssets)+';\n'+
 'for(const [name,src] of Object.entries(embeddedCSSAssets)){const raw=atob(src.slice(src.indexOf(",")+1));const url=URL.createObjectURL(new Blob([Uint8Array.from(raw,c=>c.charCodeAt(0))],{type:src.slice(5,src.indexOf(";"))}));document.documentElement.style.setProperty("--offline-"+name,\'url("\'+url+\'")\');}\n';
const js='const embeddedAssets='+JSON.stringify(assets)+';\n'+cssSetup+bundle.outputFiles[0].text;
new vm.Script(js);if(/<\/script/i.test(js))throw new Error('Unsafe script embedding');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('<link rel="stylesheet" href="styles.css" />',()=>'<style>'+css+'</style>').replace(/\s*<link rel="stylesheet" href="(?:field-ui|uploaded-ui|journey-polish)\.css" \/>/g,'').replace('<script type="module" src="app.js"></script>',()=>'<script>'+js+'</script>').replace('href="prototype.html"','href="Starfall-Training-Glade.html"').replaceAll('/public/ui/fang-and-feather-logo.png',asset('public/ui/fang-and-feather-logo.png'));
const embedded=html.slice(html.indexOf('<script>const embeddedAssets=')+8,html.lastIndexOf('</script>'));
if(embedded!==js)throw new Error('Standalone script changed during HTML embedding');new vm.Script(embedded);
fs.writeFileSync(path.join(root,'Starfall-Menagerie.html'),html);
console.log('Built Fang & Feather standalone: '+(Buffer.byteLength(html)/1024/1024).toFixed(1)+' MiB, embedded artwork and fonts.');
