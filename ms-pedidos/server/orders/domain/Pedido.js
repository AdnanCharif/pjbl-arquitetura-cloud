import { ValidationError, ConflictError } from './errors.js';

/** Estados do pedido (DER, seção 8.1, e cenário 6.3 do arc42). */
export const Status = Object.freeze({
  PENDENTE: 'PENDENTE',
  CONFIRMADO: 'CONFIRMADO',
  FALHA_PAGAMENTO: 'FALHA_PAGAMENTO',
  EM_PREPARO: 'EM_PREPARO',
  EM_ENTREGA: 'EM_ENTREGA',
  ENTREGUE: 'ENTREGUE',
  CANCELADO: 'CANCELADO',
});

/** Transições permitidas. Estados sem saída são finais. */
const TRANSICOES = {
  PENDENTE: ['CONFIRMADO', 'FALHA_PAGAMENTO', 'CANCELADO'],
  CONFIRMADO: ['EM_PREPARO', 'CANCELADO'],
  EM_PREPARO: ['EM_ENTREGA'],
  EM_ENTREGA: ['ENTREGUE'],
  FALHA_PAGAMENTO: [],
  ENTREGUE: [],
  CANCELADO: [],
};

/** Só é possível cancelar enquanto o restaurante não começou o preparo. */
export const CANCELAVEIS = [Status.PENDENTE, Status.CONFIRMADO];

const round2 = (n) => Math.round(n * 100) / 100;
const isNonEmpty = (s) => typeof s === 'string' && s.trim() !== '';
const isMoney = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/**
 * Entidade Pedido. Regras de negócio puras: não conhece HTTP nem PostgreSQL.
 * Os itens guardam uma cópia (snapshot) de nome e preço do cardápio no momento
 * do pedido, para que mudanças posteriores no cardápio não alterem pedidos.
 */
export class Pedido {
  constructor({
    id = null, clienteId, restauranteId, itens, enderecoEntrega,
    subtotal, taxaEntrega = 0, desconto = 0, valorTotal, status = Status.PENDENTE,
    idempotencyKey = null, criadoEm = null, atualizadoEm = null, historico = [], transacaoId = null,
  }) {
    Object.assign(this, {
      id, clienteId, restauranteId, itens, enderecoEntrega, subtotal, taxaEntrega, desconto,
      valorTotal, status, idempotencyKey, criadoEm, atualizadoEm, historico, transacaoId,
    });
  }

  static create(input = {}, now = new Date()) {
    const { clienteId, restauranteId, itens, enderecoEntrega, taxaEntrega = 0, desconto = 0, idempotencyKey = null } = input ?? {};

    if (!isNonEmpty(clienteId)) throw new ValidationError('O campo "clienteId" é obrigatório.');
    if (!isNonEmpty(restauranteId)) throw new ValidationError('O campo "restauranteId" é obrigatório.');
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new ValidationError('O pedido precisa de ao menos um item em "itens".');
    }
    itens.forEach((item, i) => {
      if (!item || !isNonEmpty(item.nome)) throw new ValidationError(`Item ${i + 1}: "nome" é obrigatório.`);
      if (!isMoney(item.precoUnitario)) throw new ValidationError(`Item ${i + 1}: "precoUnitario" deve ser um número >= 0.`);
      if (!Number.isInteger(item.quantidade) || item.quantidade < 1) {
        throw new ValidationError(`Item ${i + 1}: "quantidade" deve ser um inteiro >= 1.`);
      }
    });
    if (!enderecoEntrega || (typeof enderecoEntrega !== 'object' && !isNonEmpty(enderecoEntrega))) {
      throw new ValidationError('O campo "enderecoEntrega" é obrigatório.');
    }
    if (!isMoney(taxaEntrega)) throw new ValidationError('O campo "taxaEntrega" deve ser um número >= 0.');
    if (!isMoney(desconto)) throw new ValidationError('O campo "desconto" deve ser um número >= 0.');
    if (idempotencyKey !== null && !isNonEmpty(idempotencyKey)) {
      throw new ValidationError('O campo "idempotencyKey", quando informado, não pode ser vazio.');
    }

    const itensNormalizados = itens.map((item) => ({
      itemCardapioId: item.itemCardapioId ?? null,
      nome: item.nome.trim(),
      precoUnitario: round2(item.precoUnitario),
      quantidade: item.quantidade,
    }));
    const subtotal = round2(itensNormalizados.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0));
    if (desconto > subtotal + taxaEntrega) throw new ValidationError('O desconto não pode ser maior que o valor do pedido.');

    return new Pedido({
      clienteId: clienteId.trim(),
      restauranteId: restauranteId.trim(),
      itens: itensNormalizados,
      enderecoEntrega,
      subtotal,
      taxaEntrega: round2(taxaEntrega),
      desconto: round2(desconto),
      valorTotal: round2(subtotal + taxaEntrega - desconto),
      status: Status.PENDENTE,
      idempotencyKey: idempotencyKey?.trim() ?? null,
      criadoEm: now.toISOString(),
      atualizadoEm: now.toISOString(),
      historico: [{ status: Status.PENDENTE, ocorridoEm: now.toISOString() }],
    });
  }

  podeMudarPara(novo) {
    return (TRANSICOES[this.status] ?? []).includes(novo);
  }

  mudarStatus(novo, now = new Date()) {
    if (!Object.values(Status).includes(novo)) {
      throw new ValidationError(`Status inválido: "${novo}". Valores: ${Object.values(Status).join(', ')}.`);
    }
    if (!this.podeMudarPara(novo)) {
      throw new ConflictError(`Não é possível mudar o pedido de ${this.status} para ${novo}.`);
    }
    this.status = novo;
    this.atualizadoEm = now.toISOString();
    this.historico = [...this.historico, { status: novo, ocorridoEm: this.atualizadoEm }];
    return this;
  }

  cancelar(now = new Date()) {
    if (!CANCELAVEIS.includes(this.status)) {
      throw new ConflictError(`Pedido em ${this.status} não pode mais ser cancelado.`);
    }
    return this.mudarStatus(Status.CANCELADO, now);
  }
}
