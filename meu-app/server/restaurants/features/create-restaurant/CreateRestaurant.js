import { Restaurant } from '../../domain/Restaurant.js';

export class CreateRestaurant {
  constructor({ repository, events }) {
    this.repository = repository;
    this.events = events;
  }

  async execute(input) {
    const restaurant = Restaurant.create(input);
    const saved = await this.repository.insert(restaurant);
    await this.events.publish('RestauranteCadastrado', { id: saved.id, name: saved.name });
    return saved;
  }
}
