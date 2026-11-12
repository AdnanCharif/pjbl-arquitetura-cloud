# FastFood Delivery (Prato) — PJBL Arquitetura Cloud · Grupo 9

Aplicação distribuída de pedidos de comida com **Microfrontend, API Gateway, BFF, dois microserviços com bancos diferentes, Function serverless e eventos**, aplicando Clean Architecture, Vertical Slice e Event-Driven Architecture.

**Alunos:** Adnan Charif · Henrique Szlachta · Lucas Kumagae · Sérgio Tulio
**Disciplina:** Arquitetura Cloud — PJBL (Engenharia de Software, PUCPR)

## Arquitetura

```
Usuário
  │ HTTPS
  ▼
Frontend (React + Vite) ── Vercel
  │ Authorization: Bearer <api key>
  ▼
API Gateway (Zuplo) ── roteamento, API key, rate limit
  │
  ▼
BFF (Node.js + Express) ── Render (imagem do Docker Hub)
  ├──► Microserviço de Restaurantes ── Render ──► MongoDB Atlas (M0)
  ├──► Microserviço de Pedidos ─────── Render ──► PostgreSQL (Neon)
  └──► Function (HTTP Trigger) ─────── Vercel Functions
            calcular-pedido · resumo

Eventos (assíncrono):
  MS Restaurantes / MS Pedidos ──► Upstash QStash ──► Function /api/eventos (Message Trigger)
```

**Fluxo do `GET /aggregated-data`:** o frontend chama o gateway → o gateway encaminha ao BFF → o BFF consulta em paralelo o MS Restaurantes (MongoDB) e o MS Pedidos (PostgreSQL) → envia os dois à Function `/api/resumo`, que enriquece os dados (indicadores e nome do restaurante em cada pedido) → o BFF devolve **um único JSON**.

| Componente do enunciado | Pasta | Tecnologia | Onde roda |
| --- | --- | --- | --- |
| Microfrontend | [`frontend/`](frontend/) | React 19 + Vite | Vercel |
| API Gateway | [`gateway/`](gateway/) | Zuplo (OpenAPI + políticas) | Zuplo |
| BFF | [`bff/`](bff/) | Node.js 22, Express 5, Swagger | Render (Docker) |
| Microserviço 1 — Restaurantes | [`ms-restaurantes/`](ms-restaurantes/) | Express, MongoDB driver, Swagger | Render (Docker) + MongoDB Atlas |
| Microserviço 2 — Pedidos | [`ms-pedidos/`](ms-pedidos/) | Express, `pg`, Swagger | Render (Docker) + Neon |
| Function (HTTP + Message Trigger) | [`function-pedidos/`](function-pedidos/) | Vercel Functions (Node.js) | Vercel |
| Eventos | — | Upstash QStash | Upstash |

> **Substituição do Azure.** O grupo não tem acesso ao Azure. Com autorização do professor (ADR 4 do arc42), a *Azure Function* foi substituída por **Vercel Functions**, o *Azure SQL* por **PostgreSQL gerenciado (Neon)** e o broker de eventos é o **Upstash QStash**. Todos têm plano gratuito.

## Padrões aplicados

- **Clean Architecture** em todos os backends: `domain/` (entidades, erros, portas) → `features/` (casos de uso) → `infrastructure/` (adaptadores) → `api/` (Express) com um `composition.js` como único ponto de injeção de dependências.
- **Vertical Slice**: cada operação é uma pasta em `features/` com caso de uso + `handler.js` (ex.: `criar-pedido`, `cancelar-pedido`, `create-restaurant`).
- **Event-Driven**: os casos de uso publicam eventos pela porta `EventPublisher` depois de persistir; o adaptador `QStashEventPublisher` envia ao broker, que entrega à Function.
- **Database per Service**: MongoDB só para Restaurantes, PostgreSQL só para Pedidos; referências entre serviços apenas por id.
- **Testes unitários e de arquitetura** (dependency-cruiser) em cada backend, executados por `npm test` e no GitHub Actions.

## Links (preencher após o deploy)

| Item | URL |
| --- | --- |
| Frontend | `https://<projeto>.vercel.app` |
| API Gateway | `https://<projeto>.zuplo.app` |
| Swagger BFF | `https://pjbl-bff.onrender.com/docs` |
| Swagger MS Restaurantes | `https://pjbl-ms-restaurantes.onrender.com/docs` |
| Swagger MS Pedidos | `https://pjbl-ms-pedidos.onrender.com/docs` |
| Swagger Function + Eventos | `https://<function>.vercel.app/docs` |
| Docker Hub | `https://hub.docker.com/u/<usuario>` (`pjbl-bff`, `pjbl-ms-restaurantes`, `pjbl-ms-pedidos`) |
| Vídeo (YouTube, não listado) | `https://youtu.be/...` |

## Como rodar localmente

Pré-requisitos: Node.js 20+ e Docker Desktop.

```bash
# 1. Backends + bancos (MongoDB e PostgreSQL em containers)
docker compose up --build
#   BFF          http://localhost:3000/docs
#   Restaurantes http://localhost:3001/docs
#   Pedidos      http://localhost:3002/docs
#   Function     http://localhost:3003/docs

# 2. Carga inicial de restaurantes (outro terminal)
cd ms-restaurantes && npm install && MONGODB_URI=mongodb://localhost:27017 node scripts/seed.js

# 3. Frontend
cd frontend && npm install && npm run dev      # usa VITE_API_URL=http://localhost:3000
```

Testes de cada projeto: `cd <pasta> && npm install && npm test`.

## Deploy na nuvem

Passo a passo completo em [`docs/DEPLOY.md`](docs/DEPLOY.md): Docker Hub → Neon → Render → Vercel → Upstash QStash → Zuplo.
