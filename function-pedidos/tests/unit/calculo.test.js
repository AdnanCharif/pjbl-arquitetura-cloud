import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularPedido } from '../../lib/domain/calculo.js';
import { ValidationError } from '../../lib/domain/errors.js';

const itens = [{ precoUnitario: 59.9, quantidade: 2 }];

test('Taxa base até 2 km e ETA de 20 min + 3 min/km', () => {
  const r = calcularPedido({ itens, distanciaKm: 2 });
  assert.equal(r.subtotal, 119.8);
  assert.equal(r.taxaEntrega, 5);
  assert.equal(r.total, 124.8);
  assert.equal(r.etaMin, 26);
});

test('R$ 1,50 por km adicional, limitado a R$ 25', () => {
  assert.equal(calcularPedido({ itens, distanciaKm: 4 }).taxaEntrega, 8);
  assert.equal(calcularPedido({ itens, distanciaKm: 40 }).taxaEntrega, 25);
});

test('Frete grátis a partir de R$ 150', () => {
  const r = calcularPedido({ itens: [{ precoUnitario: 75, quantidade: 2 }], distanciaKm: 10 });
  assert.equal(r.taxaEntrega, 0);
  assert.match(r.regrasAplicadas[0], /Frete grátis/);
});

test('Cupom PJBL10 dá 10% de desconto, limitado a R$ 30; cupom inválido é rejeitado', () => {
  assert.equal(calcularPedido({ itens, distanciaKm: 2, cupom: 'pjbl10' }).desconto, 11.98);
  assert.equal(calcularPedido({ itens: [{ precoUnitario: 400, quantidade: 1 }], cupom: 'PJBL10' }).desconto, 30);
  assert.throws(() => calcularPedido({ itens, cupom: 'GRATIS' }), ValidationError);
});

test('Entradas inválidas', () => {
  assert.throws(() => calcularPedido({ itens: [] }), ValidationError);
  assert.throws(() => calcularPedido({ itens: [{ precoUnitario: -1, quantidade: 1 }] }), ValidationError);
  assert.throws(() => calcularPedido({ itens, distanciaKm: 99 }), ValidationError);
  assert.throws(() => calcularPedido(), ValidationError);
});
