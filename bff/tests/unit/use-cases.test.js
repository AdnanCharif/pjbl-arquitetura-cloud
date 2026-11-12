import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ObterDadosAgregados } from '../../server/bff/features/obter-dados-agregados/ObterDadosAgregados.js';
import { CriarPedido } from '../../server/bff/features/criar-pedido/CriarPedido.js';
import { ValidationError } from '../../server/bff/domain/errors.js';
import { fakes } from '../fakes.js';

test('ObterDadosAgregados junta MS Restaurantes, MS Pedidos e Function em um único objeto', async () => {
  const r = await new ObterDadosAgregados(fakes()).execute();
  assert.equal(r.restaurantes.length, 1);
  assert.equal(r.pedidos[0].restauranteNome, 'Sushi Kazu');
  assert.deepEqual(r.resumo, { totalRestaurantes: 1, totalPedidos: 1 });
  assert.equal(r.fontes.msRestaurantes.ok, true);
  assert.equal(r.fontes.msPedidos.ok, true);
  assert.equal(r.fontes.function.ok, true);
});

test('Falha de um microserviço não derruba o /aggregated-data (degradação parcial)', async () => {
  const r = await new ObterDadosAgregados(fakes({ restaurantesFalham: true })).execute();
  assert.deepEqual(r.restaurantes, []);
  assert.equal(r.pedidos.length, 1);
  assert.equal(r.fontes.msRestaurantes.ok, false);
  assert.match(r.fontes.msRestaurantes.erro, /indisponível/);
});

test('Falha da Function devolve pedidos sem enriquecimento e resumo nulo', async () => {
  const r = await new ObterDadosAgregados(fakes({ functionFalha: true })).execute();
  assert.equal(r.resumo, null);
  assert.equal(r.pedidos[0].restauranteNome, undefined);
  assert.equal(r.fontes.function.ok, false);
});

test('CriarPedido usa a taxa e o desconto calculados pela Function', async () => {
  const f = fakes();
  const { status, body } = await new CriarPedido(f).execute({
    clienteId: 'c1', restauranteId: 'r1', itens: [{ nome: 'X', precoUnitario: 59.9, quantidade: 1 }], enderecoEntrega: 'Rua A', distanciaKm: 4, cupom: 'PJBL10',
  });
  assert.equal(status, 201);
  assert.equal(body.calculo.total, 61.91);
  const enviado = f.calls.find(([n]) => n === 'orders.create')[1];
  assert.equal(enviado.taxaEntrega, 8);
  assert.equal(enviado.desconto, 5.99);
  assert.equal(enviado.distanciaKm, undefined);
  assert.equal(enviado.cupom, undefined);
});

test('CriarPedido sem itens falha antes de chamar os serviços', async () => {
  const f = fakes();
  await assert.rejects(new CriarPedido(f).execute({ itens: [] }), ValidationError);
  assert.equal(f.calls.length, 0);
});
