import { createApp } from './app.js';
import { buildProductionHandlers } from '../server/bff/composition.js';

const port = Number(process.env.PORT) || 3000;
createApp(buildProductionHandlers()).listen(port, () => {
  console.log(`BFF ouvindo na porta ${port} — Swagger em /docs`);
});
