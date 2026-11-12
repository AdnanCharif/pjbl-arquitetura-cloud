import { ValidationError } from '../../domain/errors.js';

/**
 * Orquestra a criação do pedido:
 * 1. a Function calcula taxa de entrega, desconto e ETA (HTTP Trigger);
 * 2. o Microserviço de Pedidos valida, autoriza o pagamento e persiste.
 * Devolve o pedido e o cálculo juntos, com o status HTTP do microserviço.
 */
export class CriarPedido {
  constructor({ orders, fn }) {
    this.orders = orders;
    this.fn = fn;
  }

  async execute(input = {}) {
    const { distanciaKm, cupom, ...pedido } = input ?? {};
    if (!Array.isArray(pedido.itens) || pedido.itens.length === 0) {
      throw new ValidationError('O pedido precisa de ao menos um item em "itens".');
    }
    const calculo = await this.fn.calcularPedido({ itens: pedido.itens, distanciaKm, cupom });
    const { status, data } = await this.orders.create({
      ...pedido,
      taxaEntrega: calculo.taxaEntrega,
      desconto: calculo.desconto,
    });
    return { status, body: { pedido: data, calculo } };
  }
}
