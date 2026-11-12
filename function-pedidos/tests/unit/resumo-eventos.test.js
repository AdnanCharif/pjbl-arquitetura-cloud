import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resumirDados } from '../../lib/domain/resumo.js';
import { processarEvento, CATALOGO } from '../../lib/domain/eventos.js';
import { ValidationError } from '../../lib/domain/errors.js';

const restaurantes = [
  { id: 'r1', name: 'Sushi Kazu', category: 'Japonesa', rating: 4.8 },
  { id: 'r2', name: 'Pizzaria do Bairro', category: 'Pizza', rating: 4.6 },
];
const pedidos = [
  { id: 'p1', restauranteId: 'r1', status: 'CONFIRMADO', valorTotal: 100, itens: [{ quantidade: 2 }] },
  { id: 'p2', restauranteId: 'r1', status: 'ENTREGUE', valorTotal: 50, itens: [{ quantidade: 1 }] },
  { id: 'p3', restauranteId: 'r2', status: 'CANCELADO', valorTotal: 80, itens: [] },
  { id: 'p4', restauranteId: 'rX', status: 'FALHA_PAGAMENTO', valorTotal: 900, itens: [] },
];

test('resumirDados calcula indicadores só com pedidos faturados', () => {
  const { indicadores } = resumirDados({ restaurantes, pedidos });
  assert.equal(indicadores.totalPedidos, 4);
  assert.equal(indicadores.faturamento, 150);
  assert.equal(indicadores.ticketMedio, 75);
  assert.equal(indicadores.notaMediaRestaurantes, 4.7);
  assert.deepEqual(indicadores.pedidosPorStatus, { CONFIRMADO: 1, ENTREGUE: 1, CANCELADO: 1, FALHA_PAGAMENTO: 1 });
  assert.deepEqual(indicadores.restauranteMaisPedido, { id: 'r1', nome: 'Sushi Kazu', pedidos: 2 });
});

test('resumirDados enriquece pedidos com o nome do restaurante', () => {
  const { pedidosEnriquecidos } = resumirDados({ restaurantes, pedidos });
  assert.equal(pedidosEnriquecidos[0].restauranteNome, 'Sushi Kazu');
  assert.equal(pedidosEnriquecidos[0].quantidadeItens, 2);
  assert.equal(pedidosEnriquecidos[3].restauranteNome, 'restaurante removido');
});

test('resumirDados tolera listas ausentes (serviço fora do ar)', () => {
  const r = resumirDados({ restaurantes: null });
  assert.equal(r.indicadores.totalRestaurantes, 0);
  assert.equal(r.indicadores.restauranteMaisPedido, null);
});

test('processarEvento gera a notificação de cada evento do catálogo', () => {
  const r = processarEvento({ event: 'PedidoCancelado', source: 'ms-pedidos', payload: { pedidoId: 'p1', clienteId: 'c1', pagamentoAutorizado: true } });
  assert.match(r.notificacao, /estorno/);
  for (const evento of Object.keys(CATALOGO)) {
    assert.ok(processarEvento({ event: evento, payload: {} }).notificacao);
  }
});

test('processarEvento rejeita evento desconhecido ou sem payload', () => {
  assert.throws(() => processarEvento({ event: 'Nada', payload: {} }), ValidationError);
  assert.throws(() => processarEvento({ event: 'PedidoConfirmado' }), ValidationError);
});
