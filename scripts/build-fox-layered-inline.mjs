import fs from 'node:fs';
import path from 'node:path';
await import('./build-fox-stocky-inline.mjs');
const root=path.resolve('public/fox-layered-preview');
const source=fs.readFileSync(path.join(root,'fox-stocky-motion.html'),'utf8').replaceAll('fox-stocky-inline','fox-layered-inline');
fs.writeFileSync(path.join(root,'inline.html'),source);
console.log('Updated the legacy inline entry to the base-fox working example.');
