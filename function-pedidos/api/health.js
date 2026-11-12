import { sendJson } from '../lib/shared/http.js';

export default function handler(_req, res) {
  sendJson(res, 200, { status: 'ok', service: 'function-pedidos' });
}
