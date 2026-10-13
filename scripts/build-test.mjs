import {build} from 'esbuild';
await build({entryPoints:['src/domains/index.ts','src/state/model.ts'],bundle:true,platform:'node',format:'esm',outdir:'dist/test',outExtension:{'.js':'.mjs'}});
