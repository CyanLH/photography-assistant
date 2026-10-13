import http from 'node:http';
import {readFile} from 'node:fs/promises';
const server=http.createServer(async(req,res)=>{if(!['/','/index.html'].includes(req.url.split('?')[0])){res.writeHead(404).end();return;}try{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile('dist/index.html'));}catch{res.writeHead(503).end('Run npm run build first');}});
server.listen(8080,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:8080'));
