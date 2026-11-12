import { NotFoundError } from '../../domain/errors.js';

export class ConsultarPedido {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute(id) {
    const pedido = await this.repository.findById(id);
    if (!pedido) throw new NotFoundError();
    return pedido;
  }
}
