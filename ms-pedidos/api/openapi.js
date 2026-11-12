const STATUS = ['PENDENTE', 'CONFIRMADO', 'FALHA_PAGAMENTO', 'EM_PREPARO', 'EM_ENTREGA', 'ENTREGUE', 'CANCELADO'];

const item = {
  type: 'object',
  required: ['nome', 'precoUnitario', 'quantidade'],
  properties: {
    itemCardapioId: { type: 'integer', example: 1, description: 'id do item no cardápio do restaurante (referência externa)' },
    nome: { type: 'string', example: 'Combinado 20 peças' },
    precoUnitario: { type: 'number', minimum: 0, example: 59.9 },
    quantidade: { type: 'integer', minimum: 1, example: 2 },
  },
};

const pedidoInput = {
  type: 'object',
  required: ['clienteId', 'restauranteId', 'itens', 'enderecoEntrega'],
  properties: {
    clienteId: { type: 'string', example: 'cliente-123' },
    restauranteId: { type: 'string', example: '6727f0c2a1b2c3d4e5f60718', description: 'id do restaurante no MS Restaurantes (sem FK)' },
    itens: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/ItemPedido' } },
    enderecoEntrega: {
      type: 'object',
      example: { rua: 'Rua Imaculada Conceição', numero: '1155', cidade: 'Curitiba' },
    },
    taxaEntrega: { type: 'number', minimum: 0, example: 7.5, description: 'Calculada pela Function calcular-pedido (via BFF)' },
    desconto: { type: 'number', minimum: 0, example: 0 },
    idempotencyKey: { type: 'string', example: '9f1c2d3e-reenvio-seguro', description: 'Reenvio com a mesma chave devolve o pedido já criado' },
  },
};

const pedido = {
  allOf: [
    pedidoInput,
    {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string', enum: STATUS },
        subtotal: { type: 'number', example: 119.8 },
        valorTotal: { type: 'number', example: 127.3 },
        transacaoId: { type: 'string', nullable: true },
        criadoEm: { type: 'string', format: 'date-time' },
        atualizadoEm: { type: 'string', format: 'date-time' },
        historico: {
          type: 'array',
          items: { type: 'object', properties: { status: { type: 'string', enum: STATUS }, ocorridoEm: { type: 'string', format: 'date-time' } } },
        },
      },
    },
  ],
};

const json = (schema) => ({ 'application/json': { schema } });
const ref = { $ref: '#/components/schemas/Pedido' };
const error = (description) => ({ description, content: json({ $ref: '#/components/schemas/Error' }) });
const idParam = { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } };

export const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'Microserviço de Pedidos — FastFood Delivery',
    version: '1.0.0',
    description:
      'Ciclo de vida do pedido (PostgreSQL / Neon). Criar pedido autoriza o pagamento (simulado) antes de confirmar; ' +
      'cada mudança publica um evento de domínio (PedidoConfirmado, PagamentoRecusado, PedidoStatusAtualizado, ' +
      'EntregaAtualizada, PedidoCancelado) no Upstash QStash. Grupo 9 — PJBL.',
  },
  tags: [{ name: 'Pedidos' }],
  paths: {
    '/api/pedidos': {
      get: {
        tags: ['Pedidos'],
        summary: 'Listar pedidos',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: STATUS } },
          { name: 'restauranteId', in: 'query', schema: { type: 'string' } },
          { name: 'clienteId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'Pedidos, mais recentes primeiro', content: json({ type: 'array', items: ref }) } },
      },
      post: {
        tags: ['Pedidos'],
        summary: 'Criar pedido (autoriza pagamento e publica PedidoConfirmado ou PagamentoRecusado)',
        description: 'Pagamento simulado: valores acima de PAYMENT_LIMIT (padrão R$ 500) são recusados.',
        requestBody: { required: true, content: json({ $ref: '#/components/schemas/PedidoInput' }) },
        responses: {
          201: { description: 'Pedido CONFIRMADO', content: json(ref) },
          200: { description: 'Pedido já existente (mesma idempotencyKey)', content: json(ref) },
          400: error('Dados inválidos'),
          402: { description: 'Pagamento recusado — pedido em FALHA_PAGAMENTO', content: json(ref) },
          503: { description: 'Gateway de pagamento indisponível — pedido em FALHA_PAGAMENTO', content: json(ref) },
        },
      },
    },
    '/api/pedidos/{id}': {
      parameters: [idParam],
      get: { tags: ['Pedidos'], summary: 'Consultar pedido', responses: { 200: { description: 'Pedido', content: json(ref) }, 404: error('Não encontrado') } },
      put: {
        tags: ['Pedidos'],
        summary: 'Atualizar status (CONFIRMADO → EM_PREPARO → EM_ENTREGA → ENTREGUE)',
        requestBody: {
          required: true,
          content: json({ type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['EM_PREPARO', 'EM_ENTREGA', 'ENTREGUE'] } } }),
        },
        responses: {
          200: { description: 'Status atualizado', content: json(ref) },
          400: error('Status inválido'),
          404: error('Não encontrado'),
          409: error('Transição não permitida a partir do status atual'),
        },
      },
      delete: {
        tags: ['Pedidos'],
        summary: 'Cancelar pedido (exclusão lógica, publica PedidoCancelado)',
        description: 'Permitido apenas em PENDENTE ou CONFIRMADO; nos demais estados responde 409.',
        responses: { 200: { description: 'Pedido CANCELADO', content: json(ref) }, 404: error('Não encontrado'), 409: error('Pedido não pode mais ser cancelado') },
      },
    },
  },
  components: {
    schemas: {
      ItemPedido: item,
      PedidoInput: pedidoInput,
      Pedido: pedido,
      Error: { type: 'object', properties: { error: { type: 'string', example: 'Pedido em EM_PREPARO não pode mais ser cancelado.' } } },
    },
  },
};
