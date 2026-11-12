const EVENTOS = [
  'RestauranteCadastrado', 'RestauranteAtualizado', 'RestauranteExcluido',
  'PedidoConfirmado', 'PagamentoRecusado', 'PedidoStatusAtualizado', 'EntregaAtualizada', 'PedidoCancelado',
];
const json = (schema, example) => ({ 'application/json': { schema, ...(example ? { example } : {}) } });
const error = { description: 'Dados inválidos', content: json({ $ref: '#/components/schemas/Error' }) };

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Function Pedidos — FastFood Delivery (Vercel Functions)',
    version: '1.0.0',
    description:
      'Funções serverless que substituem a Azure Function do enunciado. ' +
      '**HTTP Trigger:** cálculo do pedido e enriquecimento de dados (chamados pelo BFF). ' +
      '**Message Trigger:** consumidor dos eventos de domínio entregues pelo Upstash QStash. ' +
      'A seção "Eventos" documenta o contrato de todas as mensagens. Grupo 9 — PJBL.',
  },
  tags: [{ name: 'HTTP Trigger' }, { name: 'Eventos (Message Trigger)' }],
  paths: {
    '/api/calcular-pedido': {
      post: {
        tags: ['HTTP Trigger'],
        summary: 'Calcular pedido: subtotal, taxa de entrega, desconto e ETA',
        description: 'Frete: R$ 5 até 2 km + R$ 1,50/km (máx. R$ 25); grátis a partir de R$ 150. Cupom PJBL10 = 10% (máx. R$ 30). ETA = 20 min + 3 min/km.',
        requestBody: {
          required: true,
          content: json(
            {
              type: 'object',
              required: ['itens'],
              properties: {
                itens: { type: 'array', items: { type: 'object', properties: { precoUnitario: { type: 'number' }, quantidade: { type: 'integer' } } } },
                distanciaKm: { type: 'number', example: 4 },
                cupom: { type: 'string', example: 'PJBL10' },
              },
            },
            { itens: [{ precoUnitario: 59.9, quantidade: 2 }], distanciaKm: 4, cupom: 'PJBL10' },
          ),
        },
        responses: {
          200: {
            description: 'Cálculo',
            content: json({ $ref: '#/components/schemas/Calculo' }),
          },
          400: error,
        },
      },
    },
    '/api/resumo': {
      post: {
        tags: ['HTTP Trigger'],
        summary: 'Enriquecer dados agregados (indicadores e pedidos com nome do restaurante)',
        requestBody: {
          required: true,
          content: json({
            type: 'object',
            properties: { restaurantes: { type: 'array', items: { type: 'object' } }, pedidos: { type: 'array', items: { type: 'object' } } },
          }),
        },
        responses: { 200: { description: 'Indicadores', content: json({ type: 'object' }) } },
      },
    },
    '/api/eventos': {
      get: {
        tags: ['Eventos (Message Trigger)'],
        summary: 'Catálogo de eventos aceitos',
        responses: { 200: { description: 'Eventos e produtores', content: json({ type: 'array', items: { type: 'object' } }) } },
      },
      post: {
        tags: ['Eventos (Message Trigger)'],
        summary: 'Receber evento de domínio (chamado pelo Upstash QStash)',
        description: 'Os microserviços publicam no QStash, que entrega aqui com o cabeçalho Upstash-Signature (JWT HS256). A Function faz o papel do Serviço de Notificação.',
        parameters: [{ name: 'Upstash-Signature', in: 'header', schema: { type: 'string' }, description: 'Obrigatório quando as chaves de assinatura estão configuradas' }],
        requestBody: { required: true, content: json({ $ref: '#/components/schemas/Evento' }) },
        responses: {
          200: { description: 'Evento processado', content: json({ type: 'object', properties: { recebido: { type: 'boolean' }, evento: { type: 'string' }, notificacao: { type: 'string' } } }) },
          400: error,
          401: { description: 'Assinatura inválida', content: json({ $ref: '#/components/schemas/Error' }) },
        },
      },
    },
  },
  components: {
    schemas: {
      Calculo: {
        type: 'object',
        properties: {
          subtotal: { type: 'number', example: 119.8 },
          taxaEntrega: { type: 'number', example: 8 },
          desconto: { type: 'number', example: 11.98 },
          total: { type: 'number', example: 115.82 },
          distanciaKm: { type: 'number', example: 4 },
          etaMin: { type: 'integer', example: 32 },
          regrasAplicadas: { type: 'array', items: { type: 'string' } },
        },
      },
      Evento: {
        type: 'object',
        required: ['event', 'payload'],
        properties: {
          event: { type: 'string', enum: EVENTOS },
          source: { type: 'string', enum: ['ms-restaurantes', 'ms-pedidos'] },
          at: { type: 'string', format: 'date-time' },
          payload: {
            oneOf: [
              { title: 'RestauranteCadastrado', type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
              { title: 'RestauranteAtualizado / RestauranteExcluido', type: 'object', properties: { id: { type: 'string' } } },
              {
                title: 'PedidoConfirmado / PagamentoRecusado',
                type: 'object',
                properties: { pedidoId: { type: 'string' }, restauranteId: { type: 'string' }, clienteId: { type: 'string' }, valorTotal: { type: 'number' }, motivo: { type: 'string' } },
              },
              { title: 'PedidoStatusAtualizado / EntregaAtualizada', type: 'object', properties: { pedidoId: { type: 'string' }, clienteId: { type: 'string' }, status: { type: 'string' } } },
              { title: 'PedidoCancelado', type: 'object', properties: { pedidoId: { type: 'string' }, clienteId: { type: 'string' }, pagamentoAutorizado: { type: 'boolean' } } },
            ],
          },
        },
        example: { event: 'PedidoConfirmado', source: 'ms-pedidos', at: '2026-11-20T18:00:00.000Z', payload: { pedidoId: 'b1f…', restauranteId: '6727…', clienteId: 'cliente-123', valorTotal: 127.3 } },
      },
      Error: { type: 'object', properties: { error: { type: 'string' } } },
    },
  },
};
