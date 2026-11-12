import { Restaurant } from '../../domain/Restaurant.js';
import { NotFoundError } from '../../domain/errors.js';

export class UpdateRestaurant {
  constructor({ repository, events }) {
    this.repository = repository;
    this.events = events;
  }

  async execute(id, input) {
    const restaurant = Restaurant.create(input, id);
    const updated = await this.repository.update(id, restaurant);
    if (!updated) throw new NotFoundError();
    await this.events.publish('RestauranteAtualizado', { id: updated.id });
    return updated;
  }
}
