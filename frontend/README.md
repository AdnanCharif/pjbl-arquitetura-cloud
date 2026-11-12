# Frontend — Prato (React + Vite)

SPA do cliente e do restaurante. Consome **somente o API Gateway** (que encaminha ao BFF); nunca acessa os microserviços diretamente.

Faz parte do FastFood Delivery: Frontend → API Gateway (Zuplo) → **BFF** → MS Restaurantes (MongoDB) + MS Pedidos (PostgreSQL) + Function (Vercel), com eventos via Upstash QStash. Visão geral e deploy no [README da raiz](../README.md) e em [docs/DEPLOY.md](../docs/DEPLOY.md).

## Telas

| Aba | O que demonstra |
| --- | --- |
| Catálogo | Busca de restaurantes, cardápio, carrinho com prévia do total calculada pela Function (frete, cupom `PJBL10`, ETA) e criação do pedido |
| Meus pedidos | Lista com histórico de status, avançar status e cancelar (409 quando já está em preparo) |
| Gestão de restaurantes | CRUD completo de restaurantes e cardápio (MongoDB) |
| Painel | `GET /aggregated-data`: situação de cada fonte, indicadores e o JSON único |

## Tecnologias

React 19 · Vite 8 · fetch · CSS próprio (tema escuro de cardápio).

## Como rodar localmente

```bash
cp .env.example .env.local      # VITE_API_URL=http://localhost:3000 (BFF local) ou a URL do gateway
npm install
npm run dev
npm run build && npm run lint
```

Deploy: Vercel → Root Directory `frontend`, preset **Vite**, variáveis `VITE_API_URL` (URL do Zuplo) e `VITE_API_KEY` (chave do consumidor no Zuplo).

**Na nuvem:** `https://<projeto>.vercel.app`

## Alunos

Adnan Charif · Henrique Szlachta · Lucas Kumagae · Sérgio Tulio (Grupo 9 — PJBL Arquitetura Cloud, PUCPR)
