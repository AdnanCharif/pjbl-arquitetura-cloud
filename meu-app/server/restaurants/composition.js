import { MongoRestaurantRepository } from './infrastructure/MongoRestaurantRepository.js';
import { ConsoleEventPublisher } from './infrastructure/ConsoleEventPublisher.js';
import { SearchRestaurants } from './features/search-restaurants/SearchRestaurants.js';
import { CreateRestaurant } from './features/create-restaurant/CreateRestaurant.js';
import { UpdateRestaurant } from './features/update-restaurant/UpdateRestaurant.js';
import { DeleteRestaurant } from './features/delete-restaurant/DeleteRestaurant.js';
import { searchRestaurantsHandler } from './features/search-restaurants/handler.js';
import { createRestaurantHandler } from './features/create-restaurant/handler.js';
import { updateRestaurantHandler } from './features/update-restaurant/handler.js';
import { deleteRestaurantHandler } from './features/delete-restaurant/handler.js';

/**
 * Composition Root: único lugar que conhece as implementações concretas
 * e monta (injeta) as dependências de cada fatia.
 */
const repository = new MongoRestaurantRepository();
const events = new ConsoleEventPublisher();

export const search = searchRestaurantsHandler({
  searchRestaurants: new SearchRestaurants({ repository }),
});
export const create = createRestaurantHandler({
  createRestaurant: new CreateRestaurant({ repository, events }),
});
export const update = updateRestaurantHandler({
  updateRestaurant: new UpdateRestaurant({ repository, events }),
});
export const remove = deleteRestaurantHandler({
  deleteRestaurant: new DeleteRestaurant({ repository, events }),
});
