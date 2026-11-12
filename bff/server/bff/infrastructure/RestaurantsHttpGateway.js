const id = (v) => encodeURIComponent(v ?? '');

/** Adaptador da porta RestaurantsGateway — Microserviço de Restaurantes (MongoDB). */
export class RestaurantsHttpGateway {
  constructor({ http }) {
    this.http = http;
  }

  async list(query) {
    return (await this.http.request('GET', '/api/restaurants', { query })).data;
  }

  async get(restaurantId) {
    return (await this.http.request('GET', `/api/restaurants/${id(restaurantId)}`)).data;
  }

  async create(body) {
    return (await this.http.request('POST', '/api/restaurants', { body })).data;
  }

  async update(restaurantId, body) {
    return (await this.http.request('PUT', `/api/restaurants/${id(restaurantId)}`, { body })).data;
  }

  async remove(restaurantId) {
    return (await this.http.request('DELETE', `/api/restaurants/${id(restaurantId)}`)).data;
  }
}
