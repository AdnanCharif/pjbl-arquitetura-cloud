import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HttpClient } from '../../server/bff/infrastructure/HttpClient.js';
import { UpstreamError } from '../../server/bff/domain/errors.js';

const resposta = (status, body) => async () => ({ ok: status < 300, status, text: async () => JSON.stringify(body) });

test('HttpClient monta a URL com query string e devolve o JSON', async () => {
  let url;
  const http = new HttpClient({ service: 's', baseUrl: 'http://ms/', fetchFn: async (u) => ((url = u), { ok: true, status: 200, text: async () => '[1]' }) });
  const r = await http.request('GET', '/api/x', { query: { q: 'sushi', category: undefined } });
  assert.equal(url, 'http://ms/api/x?q=sushi');
  assert.deepEqual(r.data, [1]);
});

test('Erro do serviço vira UpstreamError com status e mensagem originais', async () => {
  const http = new HttpClient({ service: 'ms-pedidos', baseUrl: 'http://ms', fetchFn: resposta(409, { error: 'conflito' }) });
  await assert.rejects(http.request('DELETE', '/api/pedidos/1'), (e) => e instanceof UpstreamError && e.status === 409 && e.message === 'conflito');
});

test('Status aceito (ex.: 402) é devolvido ao chamador', async () => {
  const http = new HttpClient({ service: 'ms-pedidos', baseUrl: 'http://ms', fetchFn: resposta(402, { status: 'FALHA_PAGAMENTO' }) });
  const r = await http.request('POST', '/api/pedidos', { body: {}, accept: [402] });
  assert.equal(r.status, 402);
});

test('Falha de rede vira 502 e timeout vira 504', async () => {
  const rede = new HttpClient({ service: 's', baseUrl: 'http://ms', fetchFn: async () => { throw new TypeError('fetch failed'); } });
  await assert.rejects(rede.request('GET', '/'), (e) => e.status === 502);
  const lenta = new HttpClient({ service: 's', baseUrl: 'http://ms', timeoutMs: 10, fetchFn: (_u, { signal }) => new Promise((_r, rej) => signal.addEventListener('abort', () => rej(signal.reason))) });
  const vivo = setTimeout(() => {}, 1000); // AbortSignal.timeout não segura o event loop
  await assert.rejects(lenta.request('GET', '/'), (e) => e.status === 504);
  clearTimeout(vivo);
});

test('URL não configurada falha na montagem', () => {
  assert.throws(() => new HttpClient({ service: 'ms-pedidos', baseUrl: undefined }), /ms-pedidos/);
});
