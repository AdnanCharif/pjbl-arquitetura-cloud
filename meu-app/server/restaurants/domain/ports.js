/**
 * Portas (interfaces) exigidas pelo domínio/aplicação.
 * A infraestrutura fornece as implementações (inversão de dependência).
 *
 * @typedef {Object} RestaurantRepository
 * @property {(filter?: {q?: string, category?: string}) => Promise<import('./Restaurant.js').Restaurant[]>} search
 * @property {(id: string) => Promise<import('./Restaurant.js').Restaurant|null>} findById
 * @property {(restaurant: import('./Restaurant.js').Restaurant) => Promise<import('./Restaurant.js').Restaurant>} insert
 * @property {(id: string, restaurant: import('./Restaurant.js').Restaurant) => Promise<import('./Restaurant.js').Restaurant|null>} update
 * @property {(id: string) => Promise<boolean>} remove
 *
 * @typedef {Object} EventPublisher
 * @property {(eventName: string, payload: object) => Promise<void>} publish
 */
export {};
