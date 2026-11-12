import { randomUUID } from 'node:crypto';

/**
 * Simulação do gateway de pagamento (o gateway real continua PROJETADO, ADR 10).
 * Regras para a demonstração:
 *  - valor acima de PAYMENT_LIMIT (padrão R$ 500) → recusado (402);
 *  - PAYMENT_UNAVAILABLE=true → gateway indisponível (503).
 */
export class FakePaymentClient {
  constructor({ limit = 500, unavailable = false } = {}) {
    this.limit = limit;
    this.unavailable = unavailable;
  }

  async authorize({ valor }) {
    if (this.unavailable) throw new Error('Gateway de pagamento indisponível');
    if (valor > this.limit) return { aprovado: false, motivo: 'valor acima do limite de R$ ' + this.limit };
    return { aprovado: true, transacaoId: 'sim-' + randomUUID() };
  }
}
