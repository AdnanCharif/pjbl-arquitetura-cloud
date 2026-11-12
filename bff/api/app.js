import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './openapi.js';
import { handleError, sendJson } from '../server/shared/http.js';

/**
 * Frameworks & Drivers: rotas Express do BFF. O frontend chama só estas rotas
 * (através do API Gateway); o BFF fala com os microserviços e a Function.
 */
export function createApp(h) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => sendJson(res, 200, { status: 'ok', service: 'bff' }));
  app.get('/openapi.json', (_req, res) => sendJson(res, 200, openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'BFF — Swagger' }));
  app.get('/', (_req, res) => res.redirect('/docs'));

  app.get('/aggregated-data', h.aggregated);

  app.get('/restaurants', h.restaurants.list);
  app.post('/restaurants', h.restaurants.create);
  app.get('/restaurants/:id', h.restaurants.get);
  app.put('/restaurants/:id', h.restaurants.update);
  app.delete('/restaurants/:id', h.restaurants.remove);

  app.get('/pedidos', h.orders.list);
  app.post('/pedidos', h.orders.create);
  app.post('/pedidos/simular', h.orders.simulate);
  app.get('/pedidos/:id', h.orders.get);
  app.put('/pedidos/:id', h.orders.updateStatus);
  app.delete('/pedidos/:id', h.orders.cancel);

  app.use((_req, res) => sendJson(res, 404, { error: 'Rota não encontrada.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => handleError(res, err));
  return app;
}
