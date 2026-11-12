import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createHmac, createHash } from 'node:crypto';
import calcular from '../../api/calcular-pedido.js';
import { receberEventoHandler } from '../../lib/features/receber-evento/handler.js';
import { ReceberEvento } from '../../lib/features/receber-evento/ReceberEvento.js';
import { QStashSignatureVerifier } from '../../lib/infrastructure/QStashSignatureVerifier.js';

function fakeRes() {
  return {
    statusCode: 200, headers: {}, body: '',
    setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
    end(b = '') { this.body = b; },
    json() { return JSON.parse(this.body); },
  };
}
const b64url = (b) => Buffer.from(b).toString('base64url');
function sign(body, key, claims = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({
    iss: 'Upstash', sub: 'https://fn/api/eventos', nbf: now - 5, exp: now + 300,
    body: b64url(createHash('sha256').update(body).digest()), ...claims,
  }));
  return `${header}.${payload}.${b64url(createHmac('sha256', key).update(`${header}.${payload}`).digest())}`;
}
function eventReq(body, signature) {
  const req = Readable.from([Buffer.from(body)]);
  req.method = 'POST';
  req.headers = signature ? { 'upstash-signature': signature } : {};
  return req;
}
const handler = () =>
  receberEventoHandler({
    receberEvento: new ReceberEvento({ verifier: new QStashSignatureVerifier({ currentKey: 'atual', nextKey: 'proxima' }), logger: { info() {} } }),
  });
const evento = JSON.stringify({ event: 'PedidoConfirmado', source: 'ms-pedidos', payload: { pedidoId: 'p1', clienteId: 'c1', restauranteId: 'r1', valorTotal: 10 } });

test('HTTP Trigger calcular-pedido responde 200, 400 e 405', async () => {
  let res = fakeRes();
  await calcular({ method: 'POST', body: { itens: [{ precoUnitario: 10, quantidade: 1 }], distanciaKm: 2 } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.json().total, 15);

  res = fakeRes();
  await calcular({ method: 'POST', body: {} }, res);
  assert.equal(res.statusCode, 400);

  res = fakeRes();
  await calcular({ method: 'GET' }, res);
  assert.equal(res.statusCode, 405);
});

test('Message Trigger aceita evento assinado com a chave atual ou a próxima', async () => {
  for (const key of ['atual', 'proxima']) {
    const res = fakeRes();
    await handler()(eventReq(evento, sign(evento, key)), res);
    assert.equal(res.statusCode, 200, res.body);
    assert.match(res.json().notificacao, /confirmado/);
  }
});

test('Message Trigger rejeita assinatura ausente, chave errada, corpo alterado e expirada', async () => {
  const casos = [
    eventReq(evento),
    eventReq(evento, sign(evento, 'outra')),
    eventReq(evento.replace('10', '99'), sign(evento, 'atual')),
    eventReq(evento, sign(evento, 'atual', { exp: 1 })),
  ];
  for (const req of casos) {
    const res = fakeRes();
    await handler()(req, res);
    assert.equal(res.statusCode, 401, res.body);
  }
});

test('GET /api/eventos devolve o catálogo', async () => {
  const res = fakeRes();
  await handler()({ method: 'GET', headers: {} }, res);
  assert.ok(res.json().some((e) => e.evento === 'PedidoCancelado'));
});
