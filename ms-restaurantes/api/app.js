import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { openapi } from './openapi.js';
import { handleError, sendJson } from '../server/shared/http.js';

/**
 * Frameworks & Drivers: adaptador HTTP fino (Express). Só conhece os
 * handlers já montados pelo composition root e o kernel HTTP compartilhado.
 */
export function createApp(handlers) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => sendJson(res, 200, { status: 'ok', service: 'ms-restaurantes' }));
  app.get('/openapi.json', (_req, res) => sendJson(res, 200, openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'MS Restaurantes — Swagger' }));
  app.get('/', (_req, res) => res.redirect('/docs'));

  app.get('/api/restaurants', handlers.search);
  app.post('/api/restaurants', handlers.create);
  app.get('/api/restaurants/:id', handlers.get);
  app.put('/api/restaurants/:id', handlers.update);
  app.delete('/api/restaurants/:id', handlers.remove);

  app.use((_req, res) => sendJson(res, 404, { error: 'Rota não encontrada.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => handleError(res, err));
  return app;
}
