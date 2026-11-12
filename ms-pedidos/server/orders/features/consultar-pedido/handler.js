import { sendJson, handleError, routeId } from '../../../shared/http.js';

export function consultarPedidoHandler({ consultarPedido }) {
  return async (req, res) => {
    try {
      sendJson(res, 200, await consultarPedido.execute(routeId(req)));
    } catch (err) {
      handleError(res, err);
    }
  };
}
