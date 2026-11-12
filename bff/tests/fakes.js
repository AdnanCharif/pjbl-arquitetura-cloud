import { UpstreamError } from '../server/bff/domain/errors.js';

/** Dublês das portas do BFF (sem rede). */
export function fakes({ restaurantesFalham = false, functionFalha = false } = {}) {
  const calls = [];
  const restaurants = {
    list: async (q) => {
      calls.push(['restaurants.list', q]);
      if (restaurantesFalham) throw new UpstreamError({ service: 'ms-restaurantes', status: 502, message: 'ms-restaurantes indisponível' });
      return [{ id: 'r1', name: 'Sushi Kazu', category: 'Japonesa', rating: 4.8 }];
    },
    get: async (id) => {
      if (id === 'x') throw new UpstreamError({ service: 'ms-restaurantes', status: 404, body: { error: 'Restaurante não encontrado' } });
      return { id };
    },
    create: async (b) => ({ id: 'novo', ...b }),
    update: async (id, b) => ({ id, ...b }),
    remove: async () => ({ message: 'ok' }),
  };
  const orders = {
    list: async () => [{ id: 'p1', restauranteId: 'r1', status: 'CONFIRMADO', valorTotal: 50 }],
    get: async (id) => ({ id }),
    create: async (b) => {
      calls.push(['orders.create', b]);
      return { status: 201, data: { id: 'p2', status: 'CONFIRMADO', ...b } };
    },
    updateStatus: async (id, b) => {
      if (b.status === 'ENTREGUE') throw new UpstreamError({ service: 'ms-pedidos', status: 409, body: { error: 'Não é possível mudar o pedido de CONFIRMADO para ENTREGUE.' } });
      return { id, ...b };
    },
    cancel: async (id) => ({ id, status: 'CANCELADO' }),
  };
  const fn = {
    calcularPedido: async (input) => {
      calls.push(['fn.calcular', input]);
      return { subtotal: 59.9, taxaEntrega: 8, desconto: 5.99, total: 61.91, etaMin: 32 };
    },
    resumir: async ({ restaurantes, pedidos }) => {
      if (functionFalha) throw new UpstreamError({ service: 'function-pedidos', status: 504, message: 'timeout' });
      return {
        indicadores: { totalRestaurantes: restaurantes.length, totalPedidos: pedidos.length },
        pedidosEnriquecidos: pedidos.map((p) => ({ ...p, restauranteNome: 'Sushi Kazu' })),
      };
    },
  };
  return { restaurants, orders, fn, calls };
}
