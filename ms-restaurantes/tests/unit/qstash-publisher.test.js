import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QStashEventPublisher } from '../../server/restaurants/infrastructure/QStashEventPublisher.js';

test('QStashEventPublisher publica no endpoint /v2/publish com o token', async () => {
  const calls = [];
  const fetchFn = async (url, init) => {
    calls.push({ url, init });
    return { ok: true, text: async () => '' };
  };
  const pub = new QStashEventPublisher({ token: 't0k', destination: 'https://fn.example.com/api/eventos', source: 'ms-restaurantes', fetchFn });
  await pub.publish('RestauranteCadastrado', { id: '1' });
  assert.equal(calls[0].url, 'https://qstash.upstash.io/v2/publish/https://fn.example.com/api/eventos');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer t0k');
  assert.equal(JSON.parse(calls[0].init.body).event, 'RestauranteCadastrado');
});

test('Falha no broker não lança erro (estado já persistido — QS-04)', async () => {
  const fetchFn = async () => ({ ok: false, status: 500, text: async () => 'boom' });
  const pub = new QStashEventPublisher({ token: 't', destination: 'https://x', fetchFn });
  await assert.doesNotReject(pub.publish('RestauranteExcluido', { id: '1' }));
});
