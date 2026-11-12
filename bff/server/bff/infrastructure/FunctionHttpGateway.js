/** Adaptador da porta FunctionGateway — Vercel Functions (HTTP Trigger). */
export class FunctionHttpGateway {
  constructor({ http }) {
    this.http = http;
  }

  async calcularPedido(input) {
    return (await this.http.request('POST', '/api/calcular-pedido', { body: input })).data;
  }

  async resumir(input) {
    return (await this.http.request('POST', '/api/resumo', { body: input })).data;
  }
}
