import { sendJson, handleError, routeId } from '../../../shared/http.js';

export function cancelarPedidoHandler({ cancelarPedido }) {
  return async (req, res) => {
    try {
      sendJson(res, 200, await cancelarPedido.execute(routeId(req)));
    } catch (err) {
      handleError(res, err);
    }
  };
}
