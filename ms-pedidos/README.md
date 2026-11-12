# Microserviço de Pedidos (PostgreSQL / Neon)

Ciclo de vida do pedido: criar (com autorização de pagamento antes de confirmar), consultar, listar, avançar status e cancelar. Substitui o "Azure SQL" do enunciado por PostgreSQL gerenciado no Neon (ver README da raiz).

Faz parte do FastFood Delivery: Frontend → API Gateway (Zuplo) → **BFF** → MS Restaurantes (MongoDB) + MS Pedidos (PostgreSQL) + Function (Vercel), com eventos via Upstash QStash. Visão geral e deploy no [README da raiz](../README.md) e em [docs/DEPLOY.md](../docs/DEPLOY.md).

## Regras de negócio (arc42, seção 6)

- Total = soma dos itens + taxa de entrega − desconto (taxa e desconto vêm da Function, via BFF).
- Itens guardam cópia do nome e preço do cardápio (`nome_snapshot`, `preco_unitario`).
- **Idempotência:** reenviar com a mesma `idempotencyKey` devolve o pedido existente, sem cobrar de novo.
- **Pagamento** (simulado por `FakePaymentClient`): aprovado → `CONFIRMADO` (201); recusado (> `PAYMENT_LIMIT`, padrão R$ 500) → `FALHA_PAGAMENTO` (402); gateway fora do ar → `FALHA_PAGAMENTO` (503). Nunca confirma sem autorização.
- Status: `PENDENTE → CONFIRMADO → EM_PREPARO → EM_ENTREGA → ENTREGUE`. Cancelar só em `PENDENTE`/`CONFIRMADO`; depois disso responde **409**.
- O estado é persistido **antes** de publicar o evento (`PedidoConfirmado`, `PagamentoRecusado`, `PedidoStatusAtualizado`, `EntregaAtualizada`, `PedidoCancelado`).

## Arquitetura

```
api/                     Express, Swagger, server.js
server/orders/
├── domain/              Pedido (estados e transições), errors (Validation, NotFound, Conflict), ports
├── features/            criar-pedido · consultar-pedido · listar-pedidos · atualizar-status-pedido · cancelar-pedido
├── infrastructure/      PgOrderRepository + pg-client (esquema), FakePaymentClient, QStashEventPublisher, InMemory
└── composition.js
tests/  unit/ · api/ · architecture/ · integration/ (Postgres real, opcional)
```

Tabelas (criadas automaticamente): `pedidos`, `itens_pedido`, `historico_status`.

## Endpoints (Swagger em `/docs`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/pedidos?status=&restauranteId=&clienteId=` | Listar |
| GET | `/api/pedidos/{id}` | Consultar |
| POST | `/api/pedidos` | Criar (201 / 200 / 402 / 503) |
| PUT | `/api/pedidos/{id}` | Atualizar status (`{"status":"EM_PREPARO"}`) |
| DELETE | `/api/pedidos/{id}` | Cancelar (exclusão lógica) |

## Tecnologias

Node.js 22 · Express 5 · PostgreSQL (Neon) com `pg` · swagger-ui-express · node:test · supertest · dependency-cruiser · Docker.

## Como rodar localmente

```bash
cp .env.example .env        # DATABASE_URL do Neon ou de um Postgres local
npm install
npm run dev                 # http://localhost:3002/docs
npm test
TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/pedidos npm test   # inclui o teste de integração
```

Docker: `docker build -t SEU_USUARIO/pjbl-ms-pedidos:v1 . && docker push SEU_USUARIO/pjbl-ms-pedidos:v1`

**Na nuvem:** Render (imagem do Docker Hub) + Neon — `https://pjbl-ms-pedidos.onrender.com/docs`

## Alunos

Adnan Charif · Henrique Szlachta · Lucas Kumagae · Sérgio Tulio (Grupo 9 — PJBL Arquitetura Cloud, PUCPR)
