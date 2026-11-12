# Deploy na nuvem — passo a passo (tudo gratuito, sem Azure)

Ordem recomendada, porque cada etapa usa a URL da anterior:

| # | Etapa | Plataforma | Resultado |
| --- | --- | --- | --- |
| 1 | Publicar as imagens | Docker Hub | `usuario/pjbl-ms-restaurantes`, `pjbl-ms-pedidos`, `pjbl-bff` |
| 2 | Banco de Restaurantes | MongoDB Atlas | `MONGODB_URI` |
| 3 | Banco de Pedidos | Neon | `DATABASE_URL` |
| 4 | Function | Vercel | `https://<function>.vercel.app` |
| 5 | Broker de eventos | Upstash QStash | `QSTASH_TOKEN` e chaves de assinatura |
| 6 | Microserviços e BFF | Render | 3 URLs `https://*.onrender.com` |
| 7 | API Gateway | Zuplo | `https://<gateway>.zuplo.app` + API key |
| 8 | Frontend | Vercel | `https://<frontend>.vercel.app` |

Instale antes: **Docker Desktop** e **Node.js 20+**.

> **Conta compartilhada do grupo.** Crie todas as contas abaixo com o mesmo e-mail compartilhado (opção *Sign up with email*, não "Continue with Google/GitHub"). Assim qualquer integrante entra em qualquer painel. Todas têm plano gratuito; se alguma pedir cartão só para verificar a conta, o plano Free não gera cobrança. Guarde as senhas e as connection strings num gerenciador de senhas (ex.: Bitwarden), nunca no repositório.

---

## 1. Docker Hub

1. Crie a conta em <https://hub.docker.com> e um **Access Token** (Account settings → Personal access tokens, permissão *Read & Write*).
2. Na raiz do repositório:

```bash
docker login -u SEU_USUARIO          # cole o token como senha

docker build -t SEU_USUARIO/pjbl-ms-restaurantes:v1 ./ms-restaurantes
docker build -t SEU_USUARIO/pjbl-ms-pedidos:v1      ./ms-pedidos
docker build -t SEU_USUARIO/pjbl-bff:v1             ./bff

docker push SEU_USUARIO/pjbl-ms-restaurantes:v1
docker push SEU_USUARIO/pjbl-ms-pedidos:v1
docker push SEU_USUARIO/pjbl-bff:v1
```

> O Docker Hub só aceita `usuario/repositorio:tag`; o exemplo do enunciado `usuario/pjbl/bff:v1` vira `usuario/pjbl-bff:v1`.
>
> **No Mac com chip M1/M2/M3**, adicione `--platform linux/amd64` em cada `docker build`, porque o Render roda em amd64.
>
> **Alternativa sem Docker local:** crie os secrets `DOCKERHUB_USERNAME` e `DOCKERHUB_TOKEN` no GitHub (Settings → Secrets → Actions) e rode o workflow **Docker Hub** em Actions, informando a tag `v1`.

## 2. MongoDB Atlas (Restaurantes)

1. Crie a conta em <https://www.mongodb.com/cloud/atlas/register> com o e-mail compartilhado.
2. **Create a cluster → M0 (Free)** → provedor AWS, região *São Paulo (sa-east-1)* se houver → nome `pjbl`.
3. **Database Access → Add New Database User**: usuário `pjbl-app`, senha gerada automaticamente (anote), papel *Read and write to any database*.
4. **Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)**. O Render não tem IP fixo no plano gratuito.
5. **Connect → Drivers** e copie a connection string (`mongodb+srv://pjbl-app:<senha>@...`), trocando `<senha>` pela senha do passo 3. Esse é o `MONGODB_URI`.
6. Não precisa criar banco nem coleção: o banco `prato` e a coleção aparecem no primeiro `npm run seed` (passo 6).

## 3. Neon (Pedidos)

1. Crie a conta em <https://neon.tech> → **New project** (região *South America (São Paulo)* se houver, senão *US East*).
2. Em **Connect**, copie a connection string (`postgresql://...?sslmode=require`). Esse é o `DATABASE_URL`.
3. Não precisa criar tabelas: o MS Pedidos cria `pedidos`, `itens_pedido` e `historico_status` na primeira subida.

## 4. Function na Vercel

1. <https://vercel.com/new> → importe o repositório → **Root Directory: `function-pedidos`** → Framework Preset: **Other** → Deploy.
2. Anote a URL (ex.: `https://pjbl-function-pedidos.vercel.app`). Teste: `https://.../api/health` e o Swagger em `https://.../docs`.

> **Se a Vercel não mostrar o repositório** (ele é do Adnan e a conta compartilhada não tem acesso), há dois caminhos: o Adnan adiciona a conta GitHub compartilhada como colaboradora e instala o app da Vercel no repositório; ou faça o deploy pela linha de comando, sem GitHub:
>
> ```bash
> cd function-pedidos
> npx vercel login        # entre com o e-mail compartilhado
> npx vercel --prod       # aceite os padrões; repita na pasta frontend
> ```

## 5. Upstash QStash (eventos)

1. Crie a conta em <https://console.upstash.com> → **QStash**.
2. Copie: `QSTASH_URL`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY` e `QSTASH_NEXT_SIGNING_KEY`.
3. Na Vercel, projeto da Function → **Settings → Environment Variables**: adicione as duas *signing keys* e faça **Redeploy**. A partir daí a Function rejeita (401) mensagens sem assinatura válida.

## 6. Render (2 microserviços + BFF)

Para cada serviço: <https://dashboard.render.com> → **New → Web Service → Existing Image** → `docker.io/SEU_USUARIO/<imagem>:v1` → plano **Free** → *Health Check Path* `/health`.

| Serviço | Imagem | Variáveis de ambiente |
| --- | --- | --- |
| `pjbl-ms-restaurantes` | `pjbl-ms-restaurantes:v1` | `MONGODB_URI`, `MONGODB_DB=prato`, `QSTASH_URL`, `QSTASH_TOKEN`, `EVENTS_DESTINATION_URL=https://<function>.vercel.app/api/eventos` |
| `pjbl-ms-pedidos` | `pjbl-ms-pedidos:v1` | `DATABASE_URL`, `PAYMENT_LIMIT=500`, `QSTASH_URL`, `QSTASH_TOKEN`, `EVENTS_DESTINATION_URL=https://<function>.vercel.app/api/eventos` |
| `pjbl-bff` (criar por último) | `pjbl-bff:v1` | `RESTAURANTS_URL=https://pjbl-ms-restaurantes.onrender.com`, `ORDERS_URL=https://pjbl-ms-pedidos.onrender.com`, `FUNCTION_URL=https://<function>.vercel.app`, `UPSTREAM_TIMEOUT_MS=60000` |

Depois, carregue os restaurantes iniciais no Atlas (uma vez, da sua máquina):

```bash
cd ms-restaurantes && npm install
echo "MONGODB_URI=<sua connection string>" > .env
npm run seed
```

Confira os Swaggers: `https://pjbl-ms-restaurantes.onrender.com/docs`, `https://pjbl-ms-pedidos.onrender.com/docs` e `https://pjbl-bff.onrender.com/docs`.

> Para publicar uma nova versão: `docker build` + `docker push` com a nova tag, troque a imagem no Render (Settings → Image) e clique em **Manual Deploy**.

## 7. API Gateway no Zuplo

1. Crie a conta em <https://portal.zuplo.com> → **New Project** (template vazio).
2. Em **Code**, substitua o conteúdo de `config/routes.oas.json` e `config/policies.json` pelos arquivos da pasta [`gateway/config/`](../gateway/config/) deste repositório.
3. **Settings → Environment Variables**: `BFF_URL=https://pjbl-bff.onrender.com`.
4. **Services → API Key Service → Create Consumer** (ex.: `frontend-prato`) e copie a chave gerada.
5. Salve e anote a URL do gateway (ex.: `https://pjbl-main-abc123.zuplo.app`). Teste:

```bash
curl https://<gateway>.zuplo.app/aggregated-data                                  # 401 sem chave
curl -H "Authorization: Bearer <CHAVE>" https://<gateway>.zuplo.app/aggregated-data  # 200
```

## 8. Frontend na Vercel

1. <https://vercel.com/new> → mesmo repositório → **Root Directory: `frontend`** → Framework: **Vite**.
2. Environment Variables: `VITE_API_URL=https://<gateway>.zuplo.app` e `VITE_API_KEY=<CHAVE do Zuplo>`.
3. Deploy. O rodapé da página mostra a URL do gateway usada em todas as chamadas.

> A chave fica visível no JavaScript do navegador. Isso é aceitável para a demonstração acadêmica; em produção o gateway validaria um JWT do usuário logado (ADR 8 / ADR 13).

---

## Roteiro sugerido para o vídeo (todos falam, só URLs da nuvem)

Abra as URLs do Render 2 minutos antes de gravar: no plano free elas "dormem" após ~15 min sem uso.

1. **Arquitetura** (diagrama do README / C4): quem é cada peça e onde roda.
2. **Frontend** (Vercel): catálogo carregando pelo gateway; mostrar no DevTools → Network que a chamada vai para `*.zuplo.app`.
3. **Gateway** (Zuplo): rotas, política de API key e rate limit; `curl` sem chave = 401.
4. **CRUD MongoDB**: aba Gestão → cadastrar, editar e excluir restaurante; mostrar o documento no Atlas.
5. **Regra de negócio + Function**: montar carrinho, aplicar cupom `PJBL10` e mudar a distância (frete e ETA vêm da Function); fazer o pedido.
6. **CRUD PostgreSQL**: aba Pedidos → avançar status, cancelar (e o 409 ao cancelar em preparo); mostrar as tabelas no Neon. Pedido acima de R$ 500 = pagamento recusado.
7. **Eventos**: painel do QStash (mensagens entregues) e logs da Function na Vercel com as notificações.
8. **`GET /aggregated-data`**: aba Painel e "Ver JSON único"; Swagger do BFF executando a mesma rota.
9. **Swaggers e Docker Hub**: mostrar os 4 Swaggers e as 3 imagens publicadas.
10. **Código e testes**: estrutura Clean Architecture / Vertical Slice e `npm test` (unitários + arquitetura).
