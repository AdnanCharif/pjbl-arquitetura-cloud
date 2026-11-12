/**
 * Testes da API HTTP (Express) com o repositório em memória:
 * verificam o contrato REST documentado no Swagger, sem banco real.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../api/app.js';
import { buildHandlers } from '../../server/restaurants/composition.js';
import { InMemoryRestaurantRepository } from '../../server/restaurants/infrastructure/InMemoryRestaurantRepository.js';

function setup() {
  const published = [];
  const events = { publish: async (name, payload) => published.push({ name, payload }) };
  const app = createApp(buildHandlers({ repository: new InMemoryRestaurantRepository(), events }));
  return { app, published };
}

const valid = { name: 'Sushi Kazu', category: 'Japonesa', deliveryTime: '35-45 min', rating: 4.8, menu: [{ name: 'Combo', price: 59.9 }] };

test('CRUD completo de restaurantes via HTTP', async () => {
  const { app, published } = setup();

  const created = await request(app).post('/api/restaurants').send(valid).expect(201);
  const id = created.body.id;
  assert.ok(id);

  const list = await request(app).get('/api/restaurants?q=sushi').expect(200);
  assert.equal(list.body.length, 1);

  await request(app).get(`/api/restaurants/${id}`).expect(200);
  const updated = await request(app).put(`/api/restaurants/${id}`).send({ ...valid, rating: 5 }).expect(200);
  assert.equal(updated.body.rating, 5);

  await request(app).delete(`/api/restaurants/${id}`).expect(200);
  await request(app).get(`/api/restaurants/${id}`).expect(404);

  assert.deepEqual(published.map((e) => e.name), ['RestauranteCadastrado', 'RestauranteAtualizado', 'RestauranteExcluido']);
});

test('POST inválido responde 400 com {error}', async () => {
  const { app } = setup();
  const res = await request(app).post('/api/restaurants').send({ ...valid, rating: 9 }).expect(400);
  assert.match(res.body.error, /rating/);
});

test('JSON malformado responde 400', async () => {
  const { app } = setup();
  await request(app).post('/api/restaurants').set('Content-Type', 'application/json').send('{"name":').expect(400);
});

test('Swagger e health estão publicados', async () => {
  const { app } = setup();
  const spec = await request(app).get('/openapi.json').expect(200);
  assert.ok(spec.body.paths['/api/restaurants/{id}']);
  await request(app).get('/health').expect(200);
  await request(app).get('/docs/').expect(200);
});
