import {spawnSync} from 'node:child_process';
for(let stage=0;stage<3;stage++)for(const group of ['', '--bodies','--families','--dwarf','--legacy']){
 const args=['scripts/import-authored-sprites.mjs',`--stage=${stage}`,...(group?[group]:[])];
 const r=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);
}
