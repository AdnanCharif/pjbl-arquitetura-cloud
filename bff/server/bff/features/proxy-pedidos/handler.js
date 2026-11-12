import { sendJson, handleError } from '../../../shared/http.js';

const wrap = (fn) => async (req, res) => {
  try {
    sendJson(res, 200, await fn(req));
  } catch (err) {
    handleError(res, err);
  }
};

export function proxyPedidosHandlers({ proxyPedidos: p }) {
  return {
    list: wrap((req) => p.listar(req.query)),
    get: wrap((req) => p.consultar(req.params.id)),
    updateStatus: wrap((req) => p.atualizarStatus(req.params.id, req.body)),
    cancel: wrap((req) => p.cancelar(req.params.id)),
  };
}
