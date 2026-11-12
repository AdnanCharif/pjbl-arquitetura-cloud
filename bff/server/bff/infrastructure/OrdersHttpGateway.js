const id = (v) => encodeURIComponent(v ?? '');

/** Adaptador da porta OrdersGateway — Microserviço de Pedidos (PostgreSQL). */
export class OrdersHttpGateway {
  constructor({ http }) {
    this.http = http;
  }

  async list(query) {
    return (await this.http.request('GET', '/api/pedidos', { query })).data;
  }

  async get(orderId) {
    return (await this.http.request('GET', `/api/pedidos/${id(orderId)}`)).data;
  }

  /** 402 (pagamento recusado) e 503 (gateway indisponível) trazem o pedido no corpo. */
  async create(body) {
    return this.http.request('POST', '/api/pedidos', { body, accept: [402, 503] });
  }

  async updateStatus(orderId, body) {
    return (await this.http.request('PUT', `/api/pedidos/${id(orderId)}`, { body })).data;
  }

  async cancel(orderId) {
    return (await this.http.request('DELETE', `/api/pedidos/${id(orderId)}`)).data;
  }
}
