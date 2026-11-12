import { createApp } from './app.js';
import { buildProductionHandlers } from '../server/restaurants/composition.js';

const port = Number(process.env.PORT) || 3001;
createApp(buildProductionHandlers()).listen(port, () => {
  console.log(`ms-restaurantes ouvindo na porta ${port} — Swagger em /docs`);
});
