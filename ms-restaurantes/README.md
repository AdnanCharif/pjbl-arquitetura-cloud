# Microserviço de Restaurantes (MongoDB)

CRUD de restaurantes e cardápios do FastFood Delivery. Cada escrita publica um evento de domínio (`RestauranteCadastrado`, `RestauranteAtualizado`, `RestauranteExcluido`) no Upstash QStash.

Faz parte do FastFood Delivery: Frontend → API Gateway (Zuplo) → **BFF** → MS Restaurantes (MongoDB) + MS Pedidos (PostgreSQL) + Function (Vercel), com eventos via Upstash QStash. Visão geral e deploy no [README da raiz](../README.md) e em [docs/DEPLOY.md](../docs/DEPLOY.md).

## Arquitetura

Clean Architecture + Vertical Slice (ADR 5):

```
api/                  Frameworks & Drivers: Express (app.js), Swagger (openapi.js), server.js
server/
├── shared/http.js    kernel HTTP: sendJson, handleError (erro de domínio → status)
└── restaurants/
    ├── domain/       Restaurant (validação), errors, ports (RestaurantRepository, EventPublisher)
    ├── features/     uma pasta por caso de uso: search · get · create · update · delete
    ├── infrastructure/  MongoRestaurantRepository, QStashEventPublisher, ConsoleEventPublisher, InMemory (testes)
    └── composition.js   composition root (injeção de dependências)
tests/  unit/ · api/ (supertest) · architecture/ (dependency-cruiser)
```

## Endpoints (Swagger em `/docs`)

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/restaurants?q=&category=` | Pesquisar |
| GET | `/api/restaurants/{id}` | Consultar |
| POST | `/api/restaurants` | Cadastrar → `RestauranteCadastrado` |
| PUT | `/api/restaurants/{id}` | Alterar → `RestauranteAtualizado` |
| DELETE | `/api/restaurants/{id}` | Excluir → `RestauranteExcluido` |

## Tecnologias

Node.js 22 · Express 5 · MongoDB driver 6 (Atlas M0) · swagger-ui-express · node:test · supertest · dependency-cruiser · Docker.

## Como rodar localmente

```bash
cp .env.example .env        # preencha MONGODB_URI (sem QSTASH_* os eventos vão para o log)
npm install
npm run dev                 # http://localhost:3001/docs
npm run seed                # carga inicial (idempotente)
npm test                    # unitários + API + arquitetura
```

Docker: `docker build -t SEU_USUARIO/pjbl-ms-restaurantes:v1 . && docker push SEU_USUARIO/pjbl-ms-restaurantes:v1`

**Na nuvem:** Render (imagem do Docker Hub) — `https://pjbl-ms-restaurantes.onrender.com/docs`

## Alunos

Adnan Charif · Henrique Szlachta · Lucas Kumagae · Sérgio Tulio (Grupo 9 — PJBL Arquitetura Cloud, PUCPR)
