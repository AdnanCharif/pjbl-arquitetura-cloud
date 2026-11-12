# API Gateway (Zuplo)

Entrada única do frontend: **roteamento** para o BFF, **segurança** (API key obrigatória, `Authorization: Bearer <chave>`) e **rate limit** (120 requisições/min por IP). Substitui o AWS API Gateway sugerido no enunciado por um gateway gerenciado com plano gratuito.

| Arquivo | Conteúdo |
| --- | --- |
| [`config/routes.oas.json`](config/routes.oas.json) | Rotas (OpenAPI 3.1) encaminhadas a `${env.BFF_URL}` com `urlForwardHandler` |
| [`config/policies.json`](config/policies.json) | Políticas `api-key-auth` e `rate-limit` |

Rotas: `/aggregated-data`, `/restaurants`, `/restaurants/{id}`, `/pedidos`, `/pedidos/simular`, `/pedidos/{id}` (com chave) e `/health` (sem chave).

## Como publicar

Passo 7 de [docs/DEPLOY.md](../docs/DEPLOY.md): criar o projeto no Zuplo, colar os dois arquivos em **Code**, definir `BFF_URL` e criar o consumidor da API key.

```bash
curl https://<gateway>.zuplo.app/aggregated-data                                    # 401
curl -H "Authorization: Bearer <CHAVE>" https://<gateway>.zuplo.app/aggregated-data   # 200
```

## Alunos

Adnan Charif · Henrique Szlachta · Lucas Kumagae · Sérgio Tulio (Grupo 9 — PJBL Arquitetura Cloud, PUCPR)
