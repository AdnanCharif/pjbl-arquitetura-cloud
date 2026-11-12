import { HttpClient } from './infrastructure/HttpClient.js';
import { RestaurantsHttpGateway } from './infrastructure/RestaurantsHttpGateway.js';
import { OrdersHttpGateway } from './infrastructure/OrdersHttpGateway.js';
import { FunctionHttpGateway } from './infrastructure/FunctionHttpGateway.js';
import { ObterDadosAgregados } from './features/obter-dados-agregados/ObterDadosAgregados.js';
import { ProxyRestaurantes } from './features/proxy-restaurantes/ProxyRestaurantes.js';
import { ProxyPedidos } from './features/proxy-pedidos/ProxyPedidos.js';
import { CriarPedido } from './features/criar-pedido/CriarPedido.js';
import { SimularPedido } from './features/simular-pedido/SimularPedido.js';
import { obterDadosAgregadosHandler } from './features/obter-dados-agregados/handler.js';
import { proxyRestaurantesHandlers } from './features/proxy-restaurantes/handler.js';
import { proxyPedidosHandlers } from './features/proxy-pedidos/handler.js';
import { criarPedidoHandler } from './features/criar-pedido/handler.js';
import { simularPedidoHandler } from './features/simular-pedido/handler.js';

/** Composition Root do BFF: liga os casos de uso aos clientes HTTP dos serviços. */
export function buildHandlers({ restaurants, orders, fn }) {
  return {
    aggregated: obterDadosAgregadosHandler({ obterDadosAgregados: new ObterDadosAgregados({ restaurants, orders, fn }) }),
    restaurants: proxyRestaurantesHandlers({ proxyRestaurantes: new ProxyRestaurantes({ restaurants }) }),
    orders: {
      ...proxyPedidosHandlers({ proxyPedidos: new ProxyPedidos({ orders }) }),
      create: criarPedidoHandler({ criarPedido: new CriarPedido({ orders, fn }) }),
      simulate: simularPedidoHandler({ simularPedido: new SimularPedido({ fn }) }),
    },
  };
}

export function buildProductionHandlers(env = process.env) {
  const timeoutMs = Number(env.UPSTREAM_TIMEOUT_MS) || 30000;
  const http = (service, baseUrl) => new HttpClient({ service, baseUrl, timeoutMs });
  return buildHandlers({
    restaurants: new RestaurantsHttpGateway({ http: http('ms-restaurantes', env.RESTAURANTS_URL) }),
    orders: new OrdersHttpGateway({ http: http('ms-pedidos', env.ORDERS_URL) }),
    fn: new FunctionHttpGateway({ http: http('function-pedidos', env.FUNCTION_URL) }),
  });
}
