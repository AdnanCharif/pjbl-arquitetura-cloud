import { test } from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryOrderRepository } from '../../server/orders/infrastructure/InMemoryOrderRepository.js';
import { FakePaymentClient } from '../../server/orders/infrastructure/FakePaymentClient.js';
import { CriarPedido } from '../../server/orders/features/criar-pedido/CriarPedido.js';
import { ConsultarPedido } from '../../server/orders/features/consultar-pedido/ConsultarPedido.js';
import { ListarPedidos } from '../../server/orders/features/listar-pedidos/ListarPedidos.js';
import { AtualizarStatusPedido } from '../../server/orders/features/atualizar-status-pedido/AtualizarStatusPedido.js';
import { CancelarPedido } from '../../server/orders/features/cancelar-pedido/CancelarPedido.js';
import { NotFoundError, ConflictError, ValidationError } from '../../server/orders/domain/errors.js';
import { entrada } from '../fixtures.js';

function setup(payments = new FakePaymentClient()) {
  const repository = new InMemoryOrderRepository();
  const published = [];
  const events = { publish: async (name, payload) => published.push({ name, payload }) };
  return {
    repository,
    published,
    criar: new CriarPedido({ repository, payments, events }),
    atualizar: new AtualizarStatusPedido({ repository, events }),
    cancelar: new CancelarPedido({ repository, events }),
  };
}

test('CriarPedido com pagamento aprovado persiste CONFIRMADO e publica PedidoConfirmado', async () => {
  const { criar, repository, published } = setup();
  const { pedido, resultado } = await criar.execute(entrada());
  assert.equal(resultado, 'CONFIRMADO');
  assert.equal((await repository.findById(pedido.id)).status, 'CONFIRMADO');
  assert.ok(pedido.transacaoId);
  assert.deepEqual(published.map((e) => e.name), ['PedidoConfirmado']);
});

test('CriarPedido com pagamento recusado persiste FALHA_PAGAMENTO e publica PagamentoRecusado', async () => {
  const { criar, repository, published } = setup(new FakePaymentClient({ limit: 10 }));
  const { pedido, resultado } = await criar.execute(entrada());
  assert.equal(resultado, 'RECUSADO');
  assert.equal((await repository.findById(pedido.id)).status, 'FALHA_PAGAMENTO');
  assert.equal(published[0].name, 'PagamentoRecusado');
});

test('Gateway indisponível nunca confirma o pedido (QS-03)', async () => {
  const { criar, repository } = setup(new FakePaymentClient({ unavailable: true }));
  const { pedido, resultado } = await criar.execute(entrada());
  assert.equal(resultado, 'INDISPONIVEL');
  assert.equal((await repository.findById(pedido.id)).status, 'FALHA_PAGAMENTO');
});

test('Mesma idempotencyKey devolve o pedido existente sem cobrar de novo', async () => {
  let cobrancas = 0;
  const payments = { authorize: async () => (cobrancas++, { aprovado: true, transacaoId: 't' }) };
  const { criar, repository } = setup(payments);
  const a = await criar.execute(entrada({ idempotencyKey: 'k1' }));
  const b = await criar.execute(entrada({ idempotencyKey: 'k1' }));
  assert.equal(b.resultado, 'EXISTENTE');
  assert.equal(b.pedido.id, a.pedido.id);
  assert.equal(cobrancas, 1);
  assert.equal((await repository.list()).length, 1);
});

test('Dados inválidos não persistem nem publicam evento (QS-04)', async () => {
  const { criar, repository, published } = setup();
  await assert.rejects(criar.execute(entrada({ itens: [] })), ValidationError);
  assert.equal((await repository.list()).length, 0);
  assert.equal(published.length, 0);
});

test('ConsultarPedido e ListarPedidos com filtro de status', async () => {
  const { criar, repository } = setup();
  const { pedido } = await criar.execute(entrada());
  assert.equal((await new ConsultarPedido({ repository }).execute(pedido.id)).id, pedido.id);
  await assert.rejects(new ConsultarPedido({ repository }).execute('nao-existe'), NotFoundError);
  assert.equal((await new ListarPedidos({ repository }).execute({ status: 'CONFIRMADO' })).length, 1);
  assert.equal((await new ListarPedidos({ repository }).execute({ status: 'ENTREGUE' })).length, 0);
});

test('AtualizarStatusPedido avança o pedido e publica EntregaAtualizada na entrega', async () => {
  const { criar, atualizar, published } = setup();
  const { pedido } = await criar.execute(entrada());
  await atualizar.execute(pedido.id, { status: 'EM_PREPARO' });
  const p = await atualizar.execute(pedido.id, { status: 'EM_ENTREGA' });
  assert.equal(p.status, 'EM_ENTREGA');
  assert.deepEqual(published.map((e) => e.name), ['PedidoConfirmado', 'PedidoStatusAtualizado', 'EntregaAtualizada']);
  await assert.rejects(atualizar.execute(pedido.id, { status: 'CANCELADO' }), ValidationError);
});

test('CancelarPedido: permitido se CONFIRMADO (com estorno), 409 se EM_PREPARO', async () => {
  const { criar, atualizar, cancelar, published } = setup();
  const a = (await criar.execute(entrada())).pedido;
  const cancelado = await cancelar.execute(a.id);
  assert.equal(cancelado.status, 'CANCELADO');
  assert.deepEqual(published.at(-1), { name: 'PedidoCancelado', payload: { pedidoId: a.id, clienteId: 'cliente-1', pagamentoAutorizado: true } });

  const b = (await criar.execute(entrada())).pedido;
  await atualizar.execute(b.id, { status: 'EM_PREPARO' });
  await assert.rejects(cancelar.execute(b.id), ConflictError);
  await assert.rejects(cancelar.execute('nao-existe'), NotFoundError);
});
