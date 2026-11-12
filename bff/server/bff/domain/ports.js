/**
 * Portas do BFF: os casos de uso dependem destas interfaces, e a
 * infraestrutura as implementa com chamadas HTTP aos serviços.
 *
 * @typedef {Object} RestaurantsGateway       (Microserviço 1 — MongoDB)
 * @property {(query?: object) => Promise<object[]>} list
 * @property {(id: string) => Promise<object>} get
 * @property {(body: object) => Promise<object>} create
 * @property {(id: string, body: object) => Promise<object>} update
 * @property {(id: string) => Promise<object>} remove
 *
 * @typedef {Object} OrdersGateway            (Microserviço 2 — PostgreSQL)
 * @property {(query?: object) => Promise<object[]>} list
 * @property {(id: string) => Promise<object>} get
 * @property {(body: object) => Promise<{status: number, data: object}>} create   201, 200, 402 ou 503
 * @property {(id: string, body: object) => Promise<object>} updateStatus
 * @property {(id: string) => Promise<object>} cancel
 *
 * @typedef {Object} FunctionGateway          (Vercel Functions — HTTP Trigger)
 * @property {(input: {itens: object[], distanciaKm?: number, cupom?: string}) => Promise<object>} calcularPedido
 * @property {(input: {restaurantes: object[], pedidos: object[]}) => Promise<object>} resumir
 */
export {};
