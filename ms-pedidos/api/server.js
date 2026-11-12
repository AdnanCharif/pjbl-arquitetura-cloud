import { createApp } from './app.js';
import { buildProductionHandlers } from '../server/orders/composition.js';

const port = Number(process.env.PORT) || 3002;
const handlers = await buildProductionHandlers();
createApp(handlers).listen(port, () => {
  console.log(`ms-pedidos ouvindo na porta ${port} — Swagger em /docs`);
});
