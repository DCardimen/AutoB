import fs from 'node:fs';
import {chromium} from 'playwright';

const directory='docs/evidence/meshy-fox-forward-combat';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try{
 const page=await browser.newPage();
 for(const [videoName,templateName,outputName,posterName]of [['pose-preview','fox-motion-inline','rowan-pose-preview','decoded-0.6'],['combat-preview','fox-combat-inline','rowan-combat-preview','decoded-16.98']]){
  const poster=await page.evaluate(async src=>{const image=new Image();image.src=src;await image.decode();const c=document.createElement('canvas');c.width=c.height=480;c.getContext('2d').drawImage(image,0,0,480,480);return c.toDataURL('image/jpeg',.70);},'data:image/png;base64,'+fs.readFileSync(`${directory}/${posterName}.png`).toString('base64'));
  const video=fs.readFileSync(`${directory}/${videoName}.webm`).toString('base64'),template=fs.readFileSync(`scripts/${templateName}.template.html`,'utf8'),html=template.replace('@@VIDEO@@',video).replace('@@POSTER@@',poster),file=`${directory}/${outputName}.html`;
  if(Buffer.byteLength(html)>1_000_000)throw Error('Inline preview exceeds size limit');fs.writeFileSync(file,html);console.log(`${file}: ${Buffer.byteLength(html)} bytes`);
 }
}finally{await browser.close();}
