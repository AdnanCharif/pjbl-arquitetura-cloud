import { NotFoundError, ValidationError } from '../../domain/errors.js';
import { Status } from '../../domain/Pedido.js';

/**
 * Restaurante/entregador avançam o pedido: CONFIRMADO → EM_PREPARO → EM_ENTREGA → ENTREGUE.
 * A decisão é tomada sobre o estado persistido (objetivo de consistência).
 */
export class AtualizarStatusPedido {
  constructor({ repository, events, clock = () => new Date() }) {
    this.repository = repository;
    this.events = events;
    this.clock = clock;
  }

  async execute(id, { status } = {}) {
    if (status === Status.CANCELADO) {
      throw new ValidationError('Para cancelar use DELETE /api/pedidos/{id}.');
    }
    const pedido = await this.repository.findById(id);
    if (!pedido) throw new NotFoundError();
    pedido.mudarStatus(status, this.clock());
    await this.repository.saveStatus(pedido);
    const evento = [Status.EM_ENTREGA, Status.ENTREGUE].includes(status) ? 'EntregaAtualizada' : 'PedidoStatusAtualizado';
    await this.events.publish(evento, { pedidoId: pedido.id, status: pedido.status, clienteId: pedido.clienteId });
    return pedido;
  }
}
