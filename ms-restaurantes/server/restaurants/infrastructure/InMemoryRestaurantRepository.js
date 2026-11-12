import { Restaurant } from '../domain/Restaurant.js';

/** Implementação em memória, usada nos testes unitários. */
export class InMemoryRestaurantRepository {
  #items = new Map();
  #seq = 1;

  async search({ q, category } = {}) {
    return [...this.#items.values()].filter(
      (r) =>
        (!q || r.name.toLowerCase().includes(q.toLowerCase())) &&
        (!category || r.category.toLowerCase() === category.toLowerCase()),
    );
  }

  async findById(id) {
    return this.#items.get(id) ?? null;
  }

  async insert(restaurant) {
    const id = String(this.#seq++);
    const saved = new Restaurant({ ...restaurant, id });
    this.#items.set(id, saved);
    return saved;
  }

  async update(id, restaurant) {
    if (!this.#items.has(id)) return null;
    const saved = new Restaurant({ ...restaurant, id });
    this.#items.set(id, saved);
    return saved;
  }

  async remove(id) {
    return this.#items.delete(id);
  }
}
