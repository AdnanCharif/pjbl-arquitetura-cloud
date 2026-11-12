import { ValidationError } from './errors.js';

/**
 * Catálogo de eventos de domínio (seção 8.4 do arc42) e a reação do
 * consumidor: a Function faz o papel do Serviço de Notificação, montando a
 * mensagem que seria enviada ao cliente/restaurante (push/e-mail simulados).
 */
export const CATALOGO = Object.freeze({
  RestauranteCadastrado: { produtor: 'ms-restaurantes', reacao: (p) => `Novo restaurante no catálogo: ${p.name ?? p.id}. Invalidar cache do catálogo.` },
  RestauranteAtualizado: { produtor: 'ms-restaurantes', reacao: (p) => `Restaurante ${p.id} atualizado. Invalidar cache do catálogo.` },
  RestauranteExcluido: { produtor: 'ms-restaurantes', reacao: (p) => `Restaurante ${p.id} excluído. Bloquear novos pedidos para ele.` },
  PedidoConfirmado: { produtor: 'ms-pedidos', reacao: (p) => `Avisar cliente ${p.clienteId}: pedido ${p.pedidoId} confirmado (R$ ${p.valorTotal}). Avisar restaurante ${p.restauranteId}.` },
  PagamentoRecusado: { produtor: 'ms-pedidos', reacao: (p) => `Avisar cliente ${p.clienteId}: pagamento do pedido ${p.pedidoId} recusado (${p.motivo ?? 'sem motivo'}).` },
  PedidoStatusAtualizado: { produtor: 'ms-pedidos', reacao: (p) => `Avisar cliente ${p.clienteId}: pedido ${p.pedidoId} agora está ${p.status}.` },
  EntregaAtualizada: { produtor: 'ms-pedidos', reacao: (p) => `Avisar cliente ${p.clienteId}: entrega do pedido ${p.pedidoId} em ${p.status}.` },
  PedidoCancelado: {
    produtor: 'ms-pedidos',
    reacao: (p) => `Avisar cliente ${p.clienteId}: pedido ${p.pedidoId} cancelado.${p.pagamentoAutorizado ? ' Solicitar estorno do pagamento.' : ''}`,
  },
});

export function processarEvento(mensagem) {
  const { event, payload, source, at } = mensagem ?? {};
  if (typeof event !== 'string' || !CATALOGO[event]) {
    throw new ValidationError(`Evento desconhecido: "${event}". Conhecidos: ${Object.keys(CATALOGO).join(', ')}.`);
  }
  if (!payload || typeof payload !== 'object') throw new ValidationError('Evento sem "payload".');
  return {
    evento: event,
    origem: source ?? CATALOGO[event].produtor,
    ocorridoEm: at ?? null,
    notificacao: CATALOGO[event].reacao(payload),
  };
}
