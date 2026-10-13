/**
 * Carga inicial: grava no Atlas os 4 restaurantes que antes estavam mockados.
 * Uso:  npm run seed     (lê MONGODB_URI e MONGODB_DB de .env.local)
 * Idempotente: não duplica restaurantes que já existem (comparação por nome).
 */
import { MongoRestaurantRepository } from '../server/restaurants/infrastructure/MongoRestaurantRepository.js';
import { ConsoleEventPublisher } from '../server/restaurants/infrastructure/ConsoleEventPublisher.js';
import { CreateRestaurant } from '../server/restaurants/features/create-restaurant/CreateRestaurant.js';

const restaurants = [
  {
    name: 'Sushi Kazu', category: 'Japonesa', deliveryTime: '35-45 min', rating: 4.8,
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    menu: [
      { id: 1, name: 'Combinado 20 peças', price: 59.9, description: 'Sashimi, niguiri e hossomaki variados' },
      { id: 2, name: 'Temaki salmão', price: 24.9, description: 'Cone de alga com arroz, salmão e cream cheese' },
    ],
  },
  {
    name: 'Pizzaria do Bairro', category: 'Pizza', deliveryTime: '40-50 min', rating: 4.6,
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    menu: [
      { id: 1, name: 'Pizza Margherita', price: 45.0, description: 'Molho de tomate, mussarela e manjericão' },
      { id: 2, name: 'Pizza Calabresa', price: 48.0, description: 'Calabresa fatiada, cebola e mussarela' },
    ],
  },
  {
    name: 'Burger House', category: 'Hambúrguer', deliveryTime: '25-35 min', rating: 4.7,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    menu: [
      { id: 1, name: 'Cheeseburger duplo', price: 32.9, description: 'Dois hambúrgueres, cheddar e molho especial' },
      { id: 2, name: 'Batata frita grande', price: 15.9, description: 'Porção generosa com tempero da casa' },
    ],
  },
  {
    name: 'Sabor Mineiro', category: 'Brasileira', deliveryTime: '45-55 min', rating: 4.9,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    menu: [
      { id: 1, name: 'Feijão tropeiro', price: 28.0, description: 'Prato individual com arroz e couve' },
      { id: 2, name: 'Frango com quiabo', price: 30.0, description: 'Acompanha arroz e farofa' },
    ],
  },
];

const repository = new MongoRestaurantRepository();
const createRestaurant = new CreateRestaurant({ repository, events: new ConsoleEventPublisher() });

try {
  const existing = (await repository.search({})).map((r) => r.name);
  for (const r of restaurants) {
    if (existing.includes(r.name)) {
      console.log(`já existe, ignorado: ${r.name}`);
      continue;
    }
    const saved = await createRestaurant.execute(r);
    console.log(`inserido: ${saved.name} (${saved.id})`);
  }
} finally {
  const client = await globalThis.__mongoClientPromise;
  await client?.close();
}
