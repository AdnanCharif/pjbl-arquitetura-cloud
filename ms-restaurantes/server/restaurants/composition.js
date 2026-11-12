import { MongoRestaurantRepository } from './infrastructure/MongoRestaurantRepository.js';
import { ConsoleEventPublisher } from './infrastructure/ConsoleEventPublisher.js';
import { QStashEventPublisher } from './infrastructure/QStashEventPublisher.js';
import { SearchRestaurants } from './features/search-restaurants/SearchRestaurants.js';
import { GetRestaurant } from './features/get-restaurant/GetRestaurant.js';
import { CreateRestaurant } from './features/create-restaurant/CreateRestaurant.js';
import { UpdateRestaurant } from './features/update-restaurant/UpdateRestaurant.js';
import { DeleteRestaurant } from './features/delete-restaurant/DeleteRestaurant.js';
import { searchRestaurantsHandler } from './features/search-restaurants/handler.js';
import { getRestaurantHandler } from './features/get-restaurant/handler.js';
import { createRestaurantHandler } from './features/create-restaurant/handler.js';
import { updateRestaurantHandler } from './features/update-restaurant/handler.js';
import { deleteRestaurantHandler } from './features/delete-restaurant/handler.js';

/**
 * Composition Root: único lugar que conhece as implementações concretas
 * e monta (injeta) as dependências de cada fatia.
 *
 * Eventos: com QSTASH_TOKEN e EVENTS_DESTINATION_URL definidos, os eventos
 * vão para o broker (Upstash QStash); sem eles, apenas para o log.
 */
export function buildEventPublisher(env = process.env) {
  if (env.QSTASH_TOKEN && env.EVENTS_DESTINATION_URL) {
    return new QStashEventPublisher({
      token: env.QSTASH_TOKEN,
      destination: env.EVENTS_DESTINATION_URL,
      baseUrl: env.QSTASH_URL,
      source: 'ms-restaurantes',
    });
  }
  return new ConsoleEventPublisher();
}

export function buildHandlers({ repository, events }) {
  return {
    search: searchRestaurantsHandler({ searchRestaurants: new SearchRestaurants({ repository }) }),
    get: getRestaurantHandler({ getRestaurant: new GetRestaurant({ repository }) }),
    create: createRestaurantHandler({ createRestaurant: new CreateRestaurant({ repository, events }) }),
    update: updateRestaurantHandler({ updateRestaurant: new UpdateRestaurant({ repository, events }) }),
    remove: deleteRestaurantHandler({ deleteRestaurant: new DeleteRestaurant({ repository, events }) }),
  };
}

export function buildProductionHandlers() {
  return buildHandlers({ repository: new MongoRestaurantRepository(), events: buildEventPublisher() });
}
