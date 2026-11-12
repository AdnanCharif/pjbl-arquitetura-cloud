import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../api/app.js';
import { buildHandlers } from '../../server/bff/composition.js';
import { fakes } from '../fakes.js';

const app = (opts) => createApp(buildHandlers(fakes(opts)));

test('GET /aggregated-data devolve restaurantes, pedidos, resumo e fontes', async () => {
  const res = await request(app()).get('/aggregated-data').expect(200);
  assert.deepEqual(Object.keys(res.body).sort(), ['fontes', 'geradoEm', 'pedidos', 'restaurantes', 'resumo']);
});

test('Proxy de restaurantes: CRUD e repasse do 404 do microserviço', async () => {
  const a = app();
  await request(a).get('/restaurants?q=sushi').expect(200);
  await request(a).post('/restaurants').send({ name: 'X' }).expect(201);
  await request(a).put('/restaurants/r1').send({ name: 'Y' }).expect(200);
  await request(a).delete('/restaurants/r1').expect(200);
  const nf = await request(a).get('/restaurants/x').expect(404);
  assert.equal(nf.body.servico, 'ms-restaurantes');
});

test('Pedidos: criar (com Function), simular, atualizar, cancelar e repasse do 409', async () => {
  const a = app();
  const criado = await request(a)
    .post('/pedidos')
    .send({ clienteId: 'c1', restauranteId: 'r1', itens: [{ nome: 'X', precoUnitario: 59.9, quantidade: 1 }], enderecoEntrega: 'Rua A' })
    .expect(201);
  assert.ok(criado.body.pedido && criado.body.calculo);
  await request(a).post('/pedidos/simular').send({ itens: [{ precoUnitario: 1, quantidade: 1 }] }).expect(200);
  await request(a).get('/pedidos').expect(200);
  await request(a).put('/pedidos/p1').send({ status: 'EM_PREPARO' }).expect(200);
  await request(a).put('/pedidos/p1').send({ status: 'ENTREGUE' }).expect(409);
  await request(a).delete('/pedidos/p1').expect(200);
  await request(a).post('/pedidos').send({ itens: [] }).expect(400);
});

test('Swagger, health e 404', async () => {
  const a = app();
  const spec = await request(a).get('/openapi.json').expect(200);
  assert.ok(spec.body.paths['/aggregated-data']);
  await request(a).get('/docs/').expect(200);
  await request(a).get('/health').expect(200);
  await request(a).get('/nada').expect(404);
});
