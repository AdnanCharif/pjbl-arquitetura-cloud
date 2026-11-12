import { PgOrderRepository } from './infrastructure/PgOrderRepository.js';
import { ensureSchema } from './infrastructure/pg-client.js';
import { FakePaymentClient } from './infrastructure/FakePaymentClient.js';
import { ConsoleEventPublisher } from './infrastructure/ConsoleEventPublisher.js';
import { QStashEventPublisher } from './infrastructure/QStashEventPublisher.js';
import { CriarPedido } from './features/criar-pedido/CriarPedido.js';
import { ConsultarPedido } from './features/consultar-pedido/ConsultarPedido.js';
import { ListarPedidos } from './features/listar-pedidos/ListarPedidos.js';
import { AtualizarStatusPedido } from './features/atualizar-status-pedido/AtualizarStatusPedido.js';
import { CancelarPedido } from './features/cancelar-pedido/CancelarPedido.js';
import { criarPedidoHandler } from './features/criar-pedido/handler.js';
import { consultarPedidoHandler } from './features/consultar-pedido/handler.js';
import { listarPedidosHandler } from './features/listar-pedidos/handler.js';
import { atualizarStatusPedidoHandler } from './features/atualizar-status-pedido/handler.js';
import { cancelarPedidoHandler } from './features/cancelar-pedido/handler.js';

/**
 * Composition Root: único lugar que conhece as implementações concretas
 * (PostgreSQL, pagamento simulado, QStash) e as injeta em cada fatia.
 */
export function buildEventPublisher(env = process.env) {
  if (env.QSTASH_TOKEN && env.EVENTS_DESTINATION_URL) {
    return new QStashEventPublisher({
      token: env.QSTASH_TOKEN,
      destination: env.EVENTS_DESTINATION_URL,
      baseUrl: env.QSTASH_URL,
      source: 'ms-pedidos',
    });
  }
  return new ConsoleEventPublisher();
}

export function buildHandlers({ repository, payments, events }) {
  return {
    list: listarPedidosHandler({ listarPedidos: new ListarPedidos({ repository }) }),
    get: consultarPedidoHandler({ consultarPedido: new ConsultarPedido({ repository }) }),
    create: criarPedidoHandler({ criarPedido: new CriarPedido({ repository, payments, events }) }),
    updateStatus: atualizarStatusPedidoHandler({ atualizarStatusPedido: new AtualizarStatusPedido({ repository, events }) }),
    cancel: cancelarPedidoHandler({ cancelarPedido: new CancelarPedido({ repository, events }) }),
  };
}

export async function buildProductionHandlers(env = process.env) {
  await ensureSchema();
  return buildHandlers({
    repository: new PgOrderRepository(),
    payments: new FakePaymentClient({
      limit: Number(env.PAYMENT_LIMIT) || 500,
      unavailable: env.PAYMENT_UNAVAILABLE === 'true',
    }),
    events: buildEventPublisher(env),
  });
}
