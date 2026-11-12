const json = (schema, example) => ({ 'application/json': { schema, ...(example ? { example } : {}) } });
const obj = { type: 'object' };
const arr = { type: 'array', items: obj };
const err = (description) => ({ description, content: json({ $ref: '#/components/schemas/Error' }) });
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
const upstream = { 502: err('Serviço indisponível'), 504: err('Serviço não respondeu a tempo') };

const restauranteBody = {
  required: true,
  content: json(obj, {
    name: 'Sushi Kazu',
    category: 'Japonesa',
    deliveryTime: '35-45 min',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400',
    menu: [{ name: 'Combinado 20 peças', description: 'Sashimi e niguiri', price: 59.9 }],
  }),
};

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'BFF — FastFood Delivery',
    version: '1.0.0',
    description:
      'Backend for Frontend (Node.js + Express). Único backend que o frontend conhece, sempre através do API Gateway. ' +
      'Agrega o Microserviço de Restaurantes (MongoDB), o Microserviço de Pedidos (PostgreSQL) e a Function (Vercel). Grupo 9 — PJBL.',
  },
  tags: [{ name: 'Agregação' }, { name: 'Restaurantes (proxy)' }, { name: 'Pedidos' }],
  paths: {
    '/aggregated-data': {
      get: {
        tags: ['Agregação'],
        summary: 'Dados agregados: restaurantes + pedidos + indicadores da Function em um único JSON',
        description:
          'Consulta os dois microserviços em paralelo e envia o resultado à Function /api/resumo. ' +
          'Se uma fonte falhar, devolve as demais e informa o erro em "fontes".',
        responses: {
          200: {
            description: 'Resposta agregada',
            content: json({
              type: 'object',
              properties: {
                restaurantes: arr,
                pedidos: { ...arr, description: 'Pedidos enriquecidos com o nome do restaurante' },
                resumo: { ...obj, description: 'Indicadores calculados pela Function' },
                fontes: { ...obj, description: 'Situação e tempo de resposta de cada serviço' },
                geradoEm: { type: 'string', format: 'date-time' },
              },
            }),
          },
        },
      },
    },
    '/restaurants': {
      get: {
        tags: ['Restaurantes (proxy)'],
        summary: 'Pesquisar restaurantes',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Lista', content: json(arr) }, ...upstream },
      },
      post: {
        tags: ['Restaurantes (proxy)'],
        summary: 'Cadastrar restaurante',
        requestBody: restauranteBody,
        responses: { 201: { description: 'Criado', content: json(obj) }, 400: err('Dados inválidos'), ...upstream },
      },
    },
    '/restaurants/{id}': {
      parameters: [idParam],
      get: { tags: ['Restaurantes (proxy)'], summary: 'Consultar restaurante', responses: { 200: { description: 'Restaurante', content: json(obj) }, 404: err('Não encontrado') } },
      put: {
        tags: ['Restaurantes (proxy)'],
        summary: 'Alterar restaurante',
        requestBody: restauranteBody,
        responses: { 200: { description: 'Alterado', content: json(obj) }, 400: err('Dados inválidos'), 404: err('Não encontrado') },
      },
      delete: { tags: ['Restaurantes (proxy)'], summary: 'Excluir restaurante', responses: { 200: { description: 'Excluído', content: json(obj) }, 404: err('Não encontrado') } },
    },
    '/pedidos': {
      get: {
        tags: ['Pedidos'],
        summary: 'Listar pedidos',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'restauranteId', in: 'query', schema: { type: 'string' } },
          { name: 'clienteId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Lista', content: json(arr) }, ...upstream },
      },
      post: {
        tags: ['Pedidos'],
        summary: 'Criar pedido (Function calcula frete/desconto, MS Pedidos autoriza o pagamento e persiste)',
        requestBody: {
          required: true,
          content: json(obj, {
            clienteId: 'cliente-123',
            restauranteId: '6727f0c2a1b2c3d4e5f60718',
            itens: [{ itemCardapioId: 1, nome: 'Combinado 20 peças', precoUnitario: 59.9, quantidade: 2 }],
            enderecoEntrega: { rua: 'Rua Imaculada Conceição', numero: '1155', cidade: 'Curitiba' },
            distanciaKm: 4,
            cupom: 'PJBL10',
            idempotencyKey: 'pedido-123-tentativa-1',
          }),
        },
        responses: {
          201: { description: 'Pedido CONFIRMADO', content: json({ type: 'object', properties: { pedido: obj, calculo: obj } }) },
          200: { description: 'Pedido já existente (mesma idempotencyKey)', content: json(obj) },
          400: err('Dados inválidos'),
          402: { description: 'Pagamento recusado (pedido em FALHA_PAGAMENTO)', content: json(obj) },
          503: { description: 'Gateway de pagamento indisponível', content: json(obj) },
          ...upstream,
        },
      },
    },
    '/pedidos/simular': {
      post: {
        tags: ['Pedidos'],
        summary: 'Simular total do carrinho (só a Function calcular-pedido)',
        requestBody: { required: true, content: json(obj, { itens: [{ precoUnitario: 59.9, quantidade: 2 }], distanciaKm: 4, cupom: 'PJBL10' }) },
        responses: { 200: { description: 'Cálculo', content: json(obj) }, 400: err('Dados inválidos') },
      },
    },
    '/pedidos/{id}': {
      parameters: [idParam],
      get: { tags: ['Pedidos'], summary: 'Consultar pedido', responses: { 200: { description: 'Pedido', content: json(obj) }, 404: err('Não encontrado') } },
      put: {
        tags: ['Pedidos'],
        summary: 'Atualizar status do pedido',
        requestBody: { required: true, content: json(obj, { status: 'EM_PREPARO' }) },
        responses: { 200: { description: 'Atualizado', content: json(obj) }, 400: err('Status inválido'), 404: err('Não encontrado'), 409: err('Transição não permitida') },
      },
      delete: {
        tags: ['Pedidos'],
        summary: 'Cancelar pedido',
        responses: { 200: { description: 'Cancelado', content: json(obj) }, 404: err('Não encontrado'), 409: err('Não pode mais ser cancelado') },
      },
    },
  },
  components: {
    schemas: { Error: { type: 'object', properties: { error: { type: 'string' }, servico: { type: 'string' } } } },
  },
};
