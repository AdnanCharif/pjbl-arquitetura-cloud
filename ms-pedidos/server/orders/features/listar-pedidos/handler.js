import { sendJson, handleError } from '../../../shared/http.js';

export function listarPedidosHandler({ listarPedidos }) {
  return async (req, res) => {
    try {
      const { status, restauranteId, clienteId } = req.query ?? {};
      sendJson(res, 200, await listarPedidos.execute({ status, restauranteId, clienteId }));
    } catch (err) {
      handleError(res, err);
    }
  };
}
