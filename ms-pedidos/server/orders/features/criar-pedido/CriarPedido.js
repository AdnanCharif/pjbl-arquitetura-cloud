import { Pedido, Status } from '../../domain/Pedido.js';

/**
 * Criar pedido (cenário 6.3 do arc42):
 * 1. valida e calcula o total na entidade;
 * 2. idempotência: a mesma idempotencyKey devolve o pedido já criado;
 * 3. persiste PENDENTE, autoriza o pagamento de forma síncrona;
 * 4. persiste CONFIRMADO ou FALHA_PAGAMENTO ANTES de publicar o evento.
 */
export class CriarPedido {
  constructor({ repository, payments, events, clock = () => new Date() }) {
    this.repository = repository;
    this.payments = payments;
    this.events = events;
    this.clock = clock;
  }

  /** @returns {Promise<{pedido: Pedido, resultado: 'CONFIRMADO'|'RECUSADO'|'INDISPONIVEL'|'EXISTENTE'}>} */
  async execute(input) {
    const novo = Pedido.create(input, this.clock());

    if (novo.idempotencyKey) {
      const existente = await this.repository.findByIdempotencyKey(novo.idempotencyKey);
      if (existente) return { pedido: existente, resultado: 'EXISTENTE' };
    }

    const pedido = await this.repository.insert(novo);

    let autorizacao;
    try {
      autorizacao = await this.payments.authorize({ pedidoId: pedido.id, valor: pedido.valorTotal });
    } catch {
      // Gateway indisponível ou timeout: tratado como "não confirmado" (ADR 10).
      pedido.mudarStatus(Status.FALHA_PAGAMENTO, this.clock());
      await this.repository.saveStatus(pedido);
      await this.events.publish('PagamentoRecusado', this.#payload(pedido, 'gateway indisponível'));
      return { pedido, resultado: 'INDISPONIVEL' };
    }

    if (!autorizacao.aprovado) {
      pedido.mudarStatus(Status.FALHA_PAGAMENTO, this.clock());
      await this.repository.saveStatus(pedido);
      await this.events.publish('PagamentoRecusado', this.#payload(pedido, autorizacao.motivo));
      return { pedido, resultado: 'RECUSADO' };
    }

    pedido.transacaoId = autorizacao.transacaoId ?? null;
    pedido.mudarStatus(Status.CONFIRMADO, this.clock());
    await this.repository.saveStatus(pedido);
    await this.events.publish('PedidoConfirmado', this.#payload(pedido));
    return { pedido, resultado: 'CONFIRMADO' };
  }

  #payload(pedido, motivo) {
    return {
      pedidoId: pedido.id,
      restauranteId: pedido.restauranteId,
      clienteId: pedido.clienteId,
      valorTotal: pedido.valorTotal,
      ...(motivo ? { motivo } : {}),
    };
  }
}
