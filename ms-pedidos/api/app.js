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

  app.get('/health', (_req, res) => sendJson(res, 200, { status: 'ok', service: 'ms-pedidos' }));
  app.get('/openapi.json', (_req, res) => sendJson(res, 200, openapi));
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'MS Pedidos — Swagger' }));
  app.get('/', (_req, res) => res.redirect('/docs'));

  app.get('/api/pedidos', handlers.list);
  app.post('/api/pedidos', handlers.create);
  app.get('/api/pedidos/:id', handlers.get);
  app.put('/api/pedidos/:id', handlers.updateStatus);
  app.delete('/api/pedidos/:id', handlers.cancel);

  app.use((_req, res) => sendJson(res, 404, { error: 'Rota não encontrada.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => handleError(res, err));
  return app;
}
