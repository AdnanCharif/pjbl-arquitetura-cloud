export class ListarPedidos {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute({ status, restauranteId, clienteId } = {}) {
    return this.repository.list({ status, restauranteId, clienteId });
  }
}
