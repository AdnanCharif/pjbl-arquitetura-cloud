import { NotFoundError } from '../../domain/errors.js';

export class DeleteRestaurant {
  constructor({ repository, events }) {
    this.repository = repository;
    this.events = events;
  }

  async execute(id) {
    const removed = await this.repository.remove(id);
    if (!removed) throw new NotFoundError();
    await this.events.publish('RestauranteExcluido', { id });
  }
}
