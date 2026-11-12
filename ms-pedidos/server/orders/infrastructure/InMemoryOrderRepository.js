import { Pedido } from '../domain/Pedido.js';

const copy = (p) => new Pedido(structuredClone({ ...p }));

/** Implementação em memória da porta OrderRepository, usada nos testes. */
export class InMemoryOrderRepository {
  #items = new Map();
  #seq = 1;

  async insert(pedido) {
    const id = '00000000-0000-4000-8000-' + String(this.#seq++).padStart(12, '0');
    const saved = new Pedido({ ...pedido, id });
    this.#items.set(id, copy(saved));
    return saved;
  }

  async findById(id) {
    const p = this.#items.get(id);
    return p ? copy(p) : null;
  }

  async findByIdempotencyKey(key) {
    const p = [...this.#items.values()].find((x) => x.idempotencyKey === key);
    return p ? copy(p) : null;
  }

  async list({ status, restauranteId, clienteId } = {}) {
    return [...this.#items.values()]
      .filter(
        (p) =>
          (!status || p.status === status) &&
          (!restauranteId || p.restauranteId === restauranteId) &&
          (!clienteId || p.clienteId === clienteId),
      )
      .reverse()
      .map(copy);
  }

  async saveStatus(pedido) {
    this.#items.set(pedido.id, copy(pedido));
    return pedido;
  }
}
