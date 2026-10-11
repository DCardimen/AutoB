import fs from 'node:fs';
import vm from 'node:vm';
const assets=Object.fromEntries(['prototype-parts','prototype-glade','prototype-heads-8','prototype-bodies-8'].map(name=>[name,`data:image/png;base64,${fs.readFileSync(`public/${name}.png`).toString('base64')}`]));
const chunks=['(()=>{const modules={};const embeddedAssets='+JSON.stringify(assets)+';'];
for(const name of ['arena','prototype-engine','prototype-sprites','sound','prototype']){
  let code=fs.readFileSync(name+'.js','utf8');
  const exports=[...code.matchAll(/^export\s+(?:const|let|function|class)\s+(\w+)/gm)].map(m=>m[1]);
  code=code.replace(/^import\s+\{([^}]+)\}\s+from\s+['"]\.\/([\w-]+)\.js['"];?/gm,(_,names,source)=>`const {${names}}=modules[${JSON.stringify(source)}];`);
  code=code.replace(/^export\s+/gm,'');
  code=code.replace("parts.src='/public/prototype-parts.png'","parts.src=embeddedAssets['prototype-parts']");
  code=code.replace("heads.src='/public/prototype-heads-8.png'","heads.src=embeddedAssets['prototype-heads-8']");
  code=code.replace("bodies.src='/public/prototype-bodies-8.png'","bodies.src=embeddedAssets['prototype-bodies-8']");
  code=code.replace("backdrop.src='/public/prototype-glade.png'","backdrop.src=embeddedAssets['prototype-glade']");
  chunks.push(`modules[${JSON.stringify(name)}]=(()=>{${code}\nreturn {${exports.join(',')}};})();`);
}
chunks.push('})();');const js=chunks.join('\n');new vm.Script(js);
if(js.includes("src='/public/")||/<\/script/i.test(js))throw new Error('Unresolved asset or script embedding');
const html=fs.readFileSync('prototype.html','utf8').replace('<link rel="stylesheet" href="prototype.css">','<style>'+fs.readFileSync('prototype.css','utf8')+'</style>')
  .replace('<script type="module" src="prototype.js"></script>','<script>'+js+'</script>')
  .replaceAll('href="index.html"','href="Starfall-Menagerie.html"');
fs.writeFileSync('Starfall-Training-Glade.html',html);
console.log(`Built offline training glade: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MiB.`);
