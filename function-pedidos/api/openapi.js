// GET /api/openapi — especificação OpenAPI das funções e do contrato dos eventos
import { openapi } from '../lib/shared/openapi.js';
import { sendJson } from '../lib/shared/http.js';

export default function handler(_req, res) {
  sendJson(res, 200, openapi);
}
