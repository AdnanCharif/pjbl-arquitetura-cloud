import { NotFoundError } from '../../domain/errors.js';
import { Status } from '../../domain/Pedido.js';

/**
 * Cancelar pedido (DELETE): exclusão lógica. Permitido em PENDENTE ou CONFIRMADO;
 * nos demais estados a entidade lança ConflictError (409). Publica PedidoCancelado
 * para o Serviço de Pagamento estornar e o Serviço de Notificação avisar o cliente.
 */
export class CancelarPedido {
  constructor({ repository, events, clock = () => new Date() }) {
    this.repository = repository;
    this.events = events;
    this.clock = clock;
  }

  async execute(id) {
    const pedido = await this.repository.findById(id);
    if (!pedido) throw new NotFoundError();
    const pagamentoAutorizado = pedido.status === Status.CONFIRMADO;
    pedido.cancelar(this.clock());
    await this.repository.saveStatus(pedido);
    await this.events.publish('PedidoCancelado', { pedidoId: pedido.id, clienteId: pedido.clienteId, pagamentoAutorizado });
    return pedido;
  }
}
