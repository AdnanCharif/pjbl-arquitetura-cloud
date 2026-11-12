/**
 * Servidor local que imita o roteamento da Vercel (/api/<arquivo>) sem
 * precisar do Vercel CLI. Uso: npm run local  (porta 3003)
 * Em produção as funções rodam na Vercel; este arquivo serve só para
 * desenvolvimento e para o docker-compose.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const port = Number(process.env.PORT) || 3003;
const root = new URL('..', import.meta.url);

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://local');
  if (pathname === '/' || pathname === '/docs') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(await readFile(new URL('index.html', root)));
  }
  const name = pathname.match(/^\/api\/([\w-]+)$/)?.[1];
  const file = name && new URL(`api/${name}.js`, root);
  if (!file || !existsSync(file)) {
    res.statusCode = 404;
    return res.end(JSON.stringify({ error: 'Rota não encontrada.' }));
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  req.rawBody = Buffer.concat(chunks).toString('utf8');
  try {
    req.body = req.rawBody ? JSON.parse(req.rawBody) : undefined;
  } catch {
    req.body = req.rawBody;
  }
  const { default: handler } = await import(file);
  await handler(req, res);
}).listen(port, () => console.log(`function-pedidos (local) na porta ${port} — Swagger em /docs`));
