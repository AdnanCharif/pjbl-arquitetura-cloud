/**
 * Portas (interfaces) exigidas pelos casos de uso.
 * A infraestrutura fornece as implementações (inversão de dependência).
 *
 * @typedef {import('./Pedido.js').Pedido} Pedido
 *
 * @typedef {Object} OrderRepository
 * @property {(pedido: Pedido) => Promise<Pedido>} insert            grava e atribui o id
 * @property {(id: string) => Promise<Pedido|null>} findById
 * @property {(key: string) => Promise<Pedido|null>} findByIdempotencyKey
 * @property {(filter?: {status?: string, restauranteId?: string, clienteId?: string}) => Promise<Pedido[]>} list
 * @property {(pedido: Pedido) => Promise<Pedido>} saveStatus      grava status, transação e o último histórico
 *
 * @typedef {Object} PaymentClient
 * @property {(req: {pedidoId: string, valor: number}) => Promise<{aprovado: boolean, transacaoId?: string, motivo?: string}>} authorize
 *   lança erro quando o gateway de pagamento está indisponível
 *
 * @typedef {Object} EventPublisher
 * @property {(eventName: string, payload: object) => Promise<void>} publish
 */
export {};
