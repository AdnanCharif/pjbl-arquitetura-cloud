import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Pedido, Status } from '../../server/orders/domain/Pedido.js';
import { ValidationError, ConflictError } from '../../server/orders/domain/errors.js';
import { entrada } from '../fixtures.js';


test('Pedido.create calcula subtotal e total e começa PENDENTE', () => {
  const p = Pedido.create(entrada());
  assert.equal(p.subtotal, 144.7);
  assert.equal(p.valorTotal, 147.2);
  assert.equal(p.status, Status.PENDENTE);
  assert.equal(p.itens[0].nome, 'Combinado');
  assert.equal(p.historico.length, 1);
});

test('Pedido.create rejeita pedido sem itens, quantidade inválida e preço negativo', () => {
  assert.throws(() => Pedido.create(entrada({ itens: [] })), ValidationError);
  assert.throws(() => Pedido.create(entrada({ itens: [{ nome: 'X', precoUnitario: 1, quantidade: 0 }] })), ValidationError);
  assert.throws(() => Pedido.create(entrada({ itens: [{ nome: 'X', precoUnitario: -1, quantidade: 1 }] })), ValidationError);
});

test('Pedido.create exige cliente, restaurante e endereço', () => {
  assert.throws(() => Pedido.create(entrada({ clienteId: '' })), /clienteId/);
  assert.throws(() => Pedido.create(entrada({ restauranteId: undefined })), /restauranteId/);
  assert.throws(() => Pedido.create(entrada({ enderecoEntrega: null })), /enderecoEntrega/);
});

test('Desconto maior que o pedido é rejeitado', () => {
  assert.throws(() => Pedido.create(entrada({ desconto: 1000 })), ValidationError);
});

test('Fluxo feliz de status: CONFIRMADO → EM_PREPARO → EM_ENTREGA → ENTREGUE', () => {
  const p = Pedido.create(entrada());
  for (const s of [Status.CONFIRMADO, Status.EM_PREPARO, Status.EM_ENTREGA, Status.ENTREGUE]) p.mudarStatus(s);
  assert.equal(p.status, Status.ENTREGUE);
  assert.equal(p.historico.length, 5);
});

test('Transição inválida lança ConflictError; status desconhecido lança ValidationError', () => {
  const p = Pedido.create(entrada());
  assert.throws(() => p.mudarStatus(Status.ENTREGUE), ConflictError);
  assert.throws(() => p.mudarStatus('VOANDO'), ValidationError);
});

test('Cancelar só é permitido em PENDENTE ou CONFIRMADO', () => {
  const a = Pedido.create(entrada());
  a.cancelar();
  assert.equal(a.status, Status.CANCELADO);

  const b = Pedido.create(entrada()).mudarStatus(Status.CONFIRMADO).mudarStatus(Status.EM_PREPARO);
  assert.throws(() => b.cancelar(), ConflictError);
});
