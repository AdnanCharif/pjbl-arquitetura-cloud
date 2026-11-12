import { sendJson, handleError } from '../../../shared/http.js';

const wrap = (status, fn) => async (req, res) => {
  try {
    sendJson(res, status, await fn(req));
  } catch (err) {
    handleError(res, err);
  }
};

export function proxyRestaurantesHandlers({ proxyRestaurantes: p }) {
  return {
    list: wrap(200, (req) => p.listar(req.query)),
    get: wrap(200, (req) => p.consultar(req.params.id)),
    create: wrap(201, (req) => p.criar(req.body)),
    update: wrap(200, (req) => p.alterar(req.params.id, req.body)),
    remove: wrap(200, (req) => p.excluir(req.params.id)),
  };
}
