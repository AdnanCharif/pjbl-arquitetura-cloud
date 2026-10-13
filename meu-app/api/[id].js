import { update, remove } from '../../server/restaurants/composition.js';
import { methodNotAllowed } from '../../server/shared/http.js';

// PUT    /api/restaurants/:id -> alterar
// DELETE /api/restaurants/:id -> excluir
export default async function handler(req, res) {
  if (req.method === 'PUT') return update(req, res);
  if (req.method === 'DELETE') return remove(req, res);
  return methodNotAllowed(res, ['PUT', 'DELETE']);
}
