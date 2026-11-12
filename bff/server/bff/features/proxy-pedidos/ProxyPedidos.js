/** Proxy de consulta, atualização de status e cancelamento de pedidos. */
export class ProxyPedidos {
  constructor({ orders }) {
    this.orders = orders;
  }

  listar(query) {
    const { status, restauranteId, clienteId } = query ?? {};
    return this.orders.list({ status, restauranteId, clienteId });
  }

  consultar(id) {
    return this.orders.get(id);
  }

  atualizarStatus(id, body) {
    return this.orders.updateStatus(id, { status: body?.status });
  }

  cancelar(id) {
    return this.orders.cancel(id);
  }
}
