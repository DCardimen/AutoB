import fs from 'node:fs';
const root='art/melee-layers',provenance=JSON.parse(fs.readFileSync(root+'/sources.json','utf8'));
for(const file of fs.readdirSync(root+'/masters')){
 const m=JSON.parse(fs.readFileSync(root+'/masters/'+file,'utf8')),group=['knight','orc','goblin'].includes(m.identity)?'sprite':['rogue','troll'].includes(m.identity)?'family':'body',module=await import(`../authored-${group}${m.stage?'-stage'+m.stage:''}-data.js`),a=Object.values(module)[0][m.identity],sheet=m.identity==='dwarf'?'public/authored-dwarf-lineage-source.png':`public/authored-${group==='sprite'?'characters':group==='family'?'families':'bodies'}-${['juvenile','mature','apex'][m.stage]}-source.png`;
 m.source=provenance.sources.find(s=>s.file===sheet);if(!m.source)throw Error('Missing raw provenance');
 for(const f of m.facings){const bounds=a.sourceRecovery?.bounds?.[f.dir],y=bounds?Math.min(a.sourceRows[0],bounds.top):a.sourceRows[0],bottom=bounds?Math.max(a.sourceRows[1],bounds.bottom+1):a.sourceRows[1];f.sourceCrop={x:a.sourceColumns[f.dir],y,width:a.sourceColumns[f.dir+1]-a.sourceColumns[f.dir],height:bottom-y};}
 fs.writeFileSync(root+'/masters/'+file,JSON.stringify(m,null,2)+'\n');
}
