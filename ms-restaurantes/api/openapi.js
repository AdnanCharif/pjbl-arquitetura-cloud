const menuItem = {
  type: 'object',
  required: ['name', 'price'],
  properties: {
    id: { type: 'integer', example: 1 },
    name: { type: 'string', example: 'Combinado 20 peças' },
    description: { type: 'string', example: 'Salmão, atum e kani' },
    price: { type: 'number', minimum: 0, example: 59.9 },
  },
};

const restaurantInput = {
  type: 'object',
  required: ['name', 'category', 'deliveryTime', 'rating'],
  properties: {
    name: { type: 'string', example: 'Sushi Kazu' },
    category: { type: 'string', example: 'Japonesa' },
    deliveryTime: { type: 'string', example: '35-45 min' },
    rating: { type: 'number', minimum: 0, maximum: 5, example: 4.8 },
    image: { type: 'string', description: 'URL http(s) ou caminho iniciado por /', example: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c' },
    menu: { type: 'array', items: { $ref: '#/components/schemas/MenuItem' } },
  },
};

const error = (description) => ({
  description,
  content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
});
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'ObjectId do restaurante' };
const restaurantJson = { 'application/json': { schema: { $ref: '#/components/schemas/Restaurant' } } };
const body = { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RestaurantInput' } } } };

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Microserviço de Restaurantes — FastFood Delivery',
    version: '1.0.0',
    description:
      'CRUD de restaurantes e cardápios (MongoDB Atlas). Cada escrita publica um evento de domínio ' +
      '(RestauranteCadastrado, RestauranteAtualizado, RestauranteExcluido) no Upstash QStash. Grupo 9 — PJBL.',
  },
  tags: [{ name: 'Restaurantes' }],
  paths: {
    '/api/restaurants': {
      get: {
        tags: ['Restaurantes'],
        summary: 'Pesquisar restaurantes',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Parte do nome (sem diferenciar maiúsculas)' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Categoria exata (sem diferenciar maiúsculas)' },
        ],
        responses: {
          200: { description: 'Lista de restaurantes', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Restaurant' } } } } },
        },
      },
      post: {
        tags: ['Restaurantes'],
        summary: 'Cadastrar restaurante (publica RestauranteCadastrado)',
        requestBody: body,
        responses: { 201: { description: 'Criado', content: restaurantJson }, 400: error('Dados inválidos') },
      },
    },
    '/api/restaurants/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Restaurantes'],
        summary: 'Consultar restaurante por id',
        responses: { 200: { description: 'Restaurante', content: restaurantJson }, 404: error('Não encontrado') },
      },
      put: {
        tags: ['Restaurantes'],
        summary: 'Alterar restaurante (publica RestauranteAtualizado)',
        requestBody: body,
        responses: { 200: { description: 'Alterado', content: restaurantJson }, 400: error('Dados inválidos'), 404: error('Não encontrado') },
      },
      delete: {
        tags: ['Restaurantes'],
        summary: 'Excluir restaurante (publica RestauranteExcluido)',
        responses: {
          200: { description: 'Excluído', content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string' } } } } } },
          404: error('Não encontrado'),
        },
      },
    },
  },
  components: {
    schemas: {
      MenuItem: menuItem,
      RestaurantInput: restaurantInput,
      Restaurant: { allOf: [{ type: 'object', properties: { id: { type: 'string', example: '6727f0c2a1b2c3d4e5f60718' } } }, restaurantInput] },
      Error: { type: 'object', properties: { error: { type: 'string', example: 'O campo "name" é obrigatório.' } } },
    },
  },
};
