export class SearchRestaurants {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute({ q, category } = {}) {
    return this.repository.search({ q, category });
  }
}
