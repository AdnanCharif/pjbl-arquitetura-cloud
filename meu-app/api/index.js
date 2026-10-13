import { search, create } from '../../server/restaurants/composition.js';
import { methodNotAllowed } from '../../server/shared/http.js';

// GET  /api/restaurants  -> pesquisar
// POST /api/restaurants  -> inserir
export default async function handler(req, res) {
  if (req.method === 'GET') return search(req, res);
  if (req.method === 'POST') return create(req, res);
  return methodNotAllowed(res, ['GET', 'POST']);
}
