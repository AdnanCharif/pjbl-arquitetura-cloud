import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryRestaurantRepository } from '../../server/restaurants/infrastructure/InMemoryRestaurantRepository.js';
import { CreateRestaurant } from '../../server/restaurants/features/create-restaurant/CreateRestaurant.js';
import { SearchRestaurants } from '../../server/restaurants/features/search-restaurants/SearchRestaurants.js';
import { UpdateRestaurant } from '../../server/restaurants/features/update-restaurant/UpdateRestaurant.js';
import { DeleteRestaurant } from '../../server/restaurants/features/delete-restaurant/DeleteRestaurant.js';
import { NotFoundError, ValidationError } from '../../server/restaurants/domain/errors.js';

const input = (over = {}) => ({
  name: 'Cantina Bella',
  category: 'Italiana',
  deliveryTime: '30-40 min',
  rating: 4.5,
  menu: [{ name: 'Lasanha', price: 40 }],
  ...over,
});

function setup() {
  const repository = new InMemoryRestaurantRepository();
  const published = [];
  const events = { publish: async (name, payload) => published.push({ name, payload }) };
  return { repository, events, published };
}

test('CreateRestaurant persiste e publica o evento RestauranteCadastrado', async () => {
  const { repository, events, published } = setup();
  const saved = await new CreateRestaurant({ repository, events }).execute(input());
  assert.ok(saved.id);
  assert.equal(published[0].name, 'RestauranteCadastrado');
});

test('CreateRestaurant não persiste dados inválidos', async () => {
  const { repository, events, published } = setup();
  await assert.rejects(
    new CreateRestaurant({ repository, events }).execute(input({ name: '' })),
    ValidationError,
  );
  assert.equal(published.length, 0);
});

test('SearchRestaurants filtra por nome e categoria', async () => {
  const { repository, events } = setup();
  const create = new CreateRestaurant({ repository, events });
  await create.execute(input());
  await create.execute(input({ name: 'Sushi Zen', category: 'Japonesa' }));
  const search = new SearchRestaurants({ repository });
  assert.equal((await search.execute({})).length, 2);
  assert.equal((await search.execute({ q: 'sushi' })).length, 1);
  assert.equal((await search.execute({ category: 'italiana' })).length, 1);
});

test('UpdateRestaurant altera um restaurante existente', async () => {
  const { repository, events } = setup();
  const saved = await new CreateRestaurant({ repository, events }).execute(input());
  const updated = await new UpdateRestaurant({ repository, events }).execute(
    saved.id,
    input({ name: 'Nova Cantina' }),
  );
  assert.equal(updated.name, 'Nova Cantina');
});

test('UpdateRestaurant lança NotFoundError para id inexistente', async () => {
  const { repository, events } = setup();
  await assert.rejects(new UpdateRestaurant({ repository, events }).execute('999', input()), NotFoundError);
});

test('DeleteRestaurant exclui e publica RestauranteExcluido', async () => {
  const { repository, events, published } = setup();
  const saved = await new CreateRestaurant({ repository, events }).execute(input());
  await new DeleteRestaurant({ repository, events }).execute(saved.id);
  assert.equal((await repository.search({})).length, 0);
  assert.equal(published.at(-1).name, 'RestauranteExcluido');
});

test('DeleteRestaurant lança NotFoundError para id inexistente', async () => {
  const { repository, events } = setup();
  await assert.rejects(new DeleteRestaurant({ repository, events }).execute('999'), NotFoundError);
});
