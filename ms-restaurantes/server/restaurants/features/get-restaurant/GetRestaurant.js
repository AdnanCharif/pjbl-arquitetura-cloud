import { NotFoundError } from '../../domain/errors.js';

export class GetRestaurant {
  constructor({ repository }) {
    this.repository = repository;
  }

  async execute(id) {
    const restaurant = await this.repository.findById(id);
    if (!restaurant) throw new NotFoundError();
    return restaurant;
  }
}
