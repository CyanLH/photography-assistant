import {build} from 'esbuild';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const bundle=await build({entryPoints:['src/domains/index.ts'],bundle:true,format:'iife',globalName:'Domains',write:false,target:'es2023'});
const ui=await readFile('src/ui.js','utf8');
const html=(await readFile('src/index.html','utf8')).replace('<!-- APP_SCRIPT -->',()=>`<script>\n${bundle.outputFiles[0].text}\n${ui}\n</script>`);
await mkdir('dist',{recursive:true});await writeFile('dist/index.html',html);await writeFile('prototype/index.html',html);
await build({entryPoints:['src/domains/index.ts'],bundle:true,format:'esm',platform:'node',outfile:'dist/domains.mjs'});
console.log('Built dist/index.html and self-contained prototype/index.html');
