/**
 * Testes da API HTTP (Express) com repositório em memória: verificam o
 * contrato REST documentado no Swagger, sem banco real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../api/app.js';
import { buildHandlers } from '../../server/orders/composition.js';
import { InMemoryOrderRepository } from '../../server/orders/infrastructure/InMemoryOrderRepository.js';
import { FakePaymentClient } from '../../server/orders/infrastructure/FakePaymentClient.js';
import { entrada } from '../fixtures.js';

const app = (payments = new FakePaymentClient()) =>
  createApp(buildHandlers({ repository: new InMemoryOrderRepository(), payments, events: { publish: async () => {} } }));

test('CRUD de pedidos via HTTP: criar, consultar, listar, atualizar status e cancelar', async () => {
  const a = app();
  const created = await request(a).post('/api/pedidos').send(entrada()).expect(201);
  const id = created.body.id;
  assert.equal(created.body.status, 'CONFIRMADO');

  await request(a).get(`/api/pedidos/${id}`).expect(200);
  const list = await request(a).get('/api/pedidos?status=CONFIRMADO').expect(200);
  assert.equal(list.body.length, 1);

  const preparo = await request(a).put(`/api/pedidos/${id}`).send({ status: 'EM_PREPARO' }).expect(200);
  assert.equal(preparo.body.status, 'EM_PREPARO');

  const conflito = await request(a).delete(`/api/pedidos/${id}`).expect(409);
  assert.match(conflito.body.error, /não pode mais ser cancelado/);
});

test('Cancelar pedido confirmado responde 200 com status CANCELADO', async () => {
  const a = app();
  const { body } = await request(a).post('/api/pedidos').send(entrada()).expect(201);
  const res = await request(a).delete(`/api/pedidos/${body.id}`).expect(200);
  assert.equal(res.body.status, 'CANCELADO');
});

test('Pagamento recusado responde 402; gateway indisponível responde 503', async () => {
  await request(app(new FakePaymentClient({ limit: 1 }))).post('/api/pedidos').send(entrada()).expect(402);
  await request(app(new FakePaymentClient({ unavailable: true }))).post('/api/pedidos').send(entrada()).expect(503);
});

test('Validação e rotas inexistentes', async () => {
  const a = app();
  await request(a).post('/api/pedidos').send({}).expect(400);
  await request(a).get('/api/pedidos/00000000-0000-4000-8000-999999999999').expect(404);
  await request(a).put('/api/pedidos/x').send({ status: 'EM_PREPARO' }).expect(404);
  await request(a).get('/nao-existe').expect(404);
});

test('Swagger e health estão publicados', async () => {
  const a = app();
  const spec = await request(a).get('/openapi.json').expect(200);
  assert.ok(spec.body.paths['/api/pedidos/{id}'].delete);
  await request(a).get('/health').expect(200);
  await request(a).get('/docs/').expect(200);
});
