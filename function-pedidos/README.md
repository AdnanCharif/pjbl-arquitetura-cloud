# Function Pedidos (Vercel Functions)

Substitui a *Azure Function* do enunciado por funções serverless na Vercel, com os dois tipos de gatilho:

| Função | Gatilho | O que faz |
| --- | --- | --- |
| `POST /api/calcular-pedido` | **HTTP Trigger** | Cálculo: subtotal, taxa de entrega (R$ 5 até 2 km + R$ 1,50/km, máx. R$ 25, grátis a partir de R$ 150), cupom `PJBL10` (10%, máx. R$ 30) e ETA (20 min + 3 min/km) |
| `POST /api/resumo` | **HTTP Trigger** | Enriquecimento de dados para o `/aggregated-data`: indicadores e nome do restaurante em cada pedido |
| `POST /api/eventos` | **Message Trigger** | Chamada pelo Upstash QStash a cada evento de domínio; valida a assinatura (`Upstash-Signature`) e gera a notificação (papel do Serviço de Notificação). `GET` lista o catálogo de eventos |

Swagger (HTTP Trigger + contrato dos **eventos**) em `/docs`.

Faz parte do FastFood Delivery: Frontend → API Gateway (Zuplo) → **BFF** → MS Restaurantes (MongoDB) + MS Pedidos (PostgreSQL) + Function (Vercel), com eventos via Upstash QStash. Visão geral e deploy no [README da raiz](../README.md) e em [docs/DEPLOY.md](../docs/DEPLOY.md).

## Arquitetura

```
api/            uma função por arquivo (adaptadores finos)
lib/
├── domain/          calculo.js, resumo.js, eventos.js (catálogo e reações), errors
├── features/        calcular-pedido · resumir-dados · receber-evento
├── infrastructure/  QStashSignatureVerifier (JWT HS256, sem SDK), ConsoleLogger
├── shared/          http.js, openapi.js
└── composition.js
tests/  unit/ · architecture/
```

## Tecnologias

Vercel Functions (Node.js) · Upstash QStash · node:test · dependency-cruiser. Sem dependências de produção.

## Como rodar localmente

```bash
npm install
npm run local               # http://localhost:3003/docs (imita o roteamento da Vercel)
npm test
```

Deploy: Vercel → Root Directory `function-pedidos`, preset **Other**. Variáveis: `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`.

**Na nuvem:** `https://<projeto>.vercel.app/docs`

## Alunos

Adnan Charif · Henrique Szlachta · Lucas Kumagae · Sérgio Tulio (Grupo 9 — PJBL Arquitetura Cloud, PUCPR)
