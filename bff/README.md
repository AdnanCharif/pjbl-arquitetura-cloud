# BFF — Backend for Frontend (Node.js + Express)

Único backend que o frontend conhece (sempre através do API Gateway). Agrega dados, faz proxy do CRUD e orquestra a criação de pedidos com a Function.

Faz parte do FastFood Delivery: Frontend → API Gateway (Zuplo) → **BFF** → MS Restaurantes (MongoDB) + MS Pedidos (PostgreSQL) + Function (Vercel), com eventos via Upstash QStash. Visão geral e deploy no [README da raiz](../README.md) e em [docs/DEPLOY.md](../docs/DEPLOY.md).

## Endpoints (Swagger em `/docs`)

| Método | Rota | O que faz |
| --- | --- | --- |
| GET | **`/aggregated-data`** | MS Restaurantes + MS Pedidos em paralelo → Function `/api/resumo` → **um único JSON** (`restaurantes`, `pedidos` enriquecidos, `resumo`, `fontes`) |
| GET/POST | `/restaurants` | Proxy do MS Restaurantes |
| GET/PUT/DELETE | `/restaurants/{id}` | Proxy do MS Restaurantes |
| GET | `/pedidos` | Proxy do MS Pedidos |
| POST | `/pedidos` | Function calcula frete/desconto/ETA → MS Pedidos cria; devolve `{ pedido, calculo }` |
| POST | `/pedidos/simular` | Prévia do carrinho (só Function) |
| GET/PUT/DELETE | `/pedidos/{id}` | Consultar, atualizar status, cancelar |

Se um serviço falhar, o `/aggregated-data` devolve o resto e informa o erro em `fontes` (degradação parcial). Erros dos serviços (400, 404, 409) são repassados ao frontend; rede/timeout viram 502/504.

## Arquitetura

```
api/                 Express, Swagger, server.js
server/bff/
├── domain/          errors (ValidationError, UpstreamError), ports (RestaurantsGateway, OrdersGateway, FunctionGateway)
├── features/        obter-dados-agregados · proxy-restaurantes · proxy-pedidos · criar-pedido · simular-pedido
├── infrastructure/  HttpClient (fetch + timeout) e um gateway HTTP por serviço
└── composition.js
tests/  unit/ · api/ · architecture/
```

## Tecnologias

Node.js 22 · Express 5 · fetch nativo · swagger-ui-express · node:test · supertest · dependency-cruiser · Docker.

## Como rodar localmente

```bash
cp .env.example .env        # URLs dos serviços (locais ou da nuvem)
npm install
npm run dev                 # http://localhost:3000/docs
npm test
```

Docker: `docker build -t SEU_USUARIO/pjbl-bff:v1 . && docker push SEU_USUARIO/pjbl-bff:v1`

**Na nuvem:** Render (imagem do Docker Hub) — `https://pjbl-bff.onrender.com/docs`

## Alunos

Adnan Charif · Henrique Szlachta · Lucas Kumagae · Sérgio Tulio (Grupo 9 — PJBL Arquitetura Cloud, PUCPR)
