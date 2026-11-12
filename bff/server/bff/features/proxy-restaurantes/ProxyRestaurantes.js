/** Proxy do CRUD de restaurantes: o frontend nunca chama o microserviço direto. */
export class ProxyRestaurantes {
  constructor({ restaurants }) {
    this.restaurants = restaurants;
  }

  listar(query) {
    const { q, category } = query ?? {};
    return this.restaurants.list({ q, category });
  }

  consultar(id) {
    return this.restaurants.get(id);
  }

  criar(body) {
    return this.restaurants.create(body);
  }

  alterar(id, body) {
    return this.restaurants.update(id, body);
  }

  excluir(id) {
    return this.restaurants.remove(id);
  }
}
