import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Restaurant } from '../../server/restaurants/domain/Restaurant.js';
import { ValidationError } from '../../server/restaurants/domain/errors.js';

const valid = {
  name: ' Cantina Bella ',
  category: 'Italiana',
  deliveryTime: '30-40 min',
  rating: 4.6,
  menu: [{ name: 'Lasanha', description: 'Bolonhesa', price: 42.9 }],
};

test('Restaurant.create normaliza e cria um restaurante válido', () => {
  const r = Restaurant.create(valid);
  assert.equal(r.name, 'Cantina Bella');
  assert.equal(r.menu.length, 1);
});

test('Restaurant.create rejeita nome vazio', () => {
  assert.throws(() => Restaurant.create({ ...valid, name: '  ' }), ValidationError);
});

test('Restaurant.create rejeita nota fora de 0-5', () => {
  assert.throws(() => Restaurant.create({ ...valid, rating: 7 }), ValidationError);
});

test('Restaurant.create rejeita item de menu com preço negativo', () => {
  assert.throws(
    () => Restaurant.create({ ...valid, menu: [{ name: 'X', price: -1 }] }),
    ValidationError,
  );
});

test('Restaurant.create preserva a imagem e gera id para itens do menu', () => {
  const r = Restaurant.create({ ...valid, image: 'https://exemplo.com/foto.jpg' });
  assert.equal(r.image, 'https://exemplo.com/foto.jpg');
  assert.equal(r.menu[0].id, 1);
});

test('Restaurant.create mantém o id informado no item do menu', () => {
  const r = Restaurant.create({ ...valid, menu: [{ id: 7, name: 'X', price: 10 }] });
  assert.equal(r.menu[0].id, 7);
});

test('Restaurant.create rejeita imagem que não é URL http/https nem caminho', () => {
  assert.throws(() => Restaurant.create({ ...valid, image: 'javascript:alert(1)' }), ValidationError);
});
