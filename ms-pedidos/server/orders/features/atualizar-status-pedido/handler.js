import { sendJson, handleError, routeId } from '../../../shared/http.js';

export function atualizarStatusPedidoHandler({ atualizarStatusPedido }) {
  return async (req, res) => {
    try {
      sendJson(res, 200, await atualizarStatusPedido.execute(routeId(req), req.body));
    } catch (err) {
      handleError(res, err);
    }
  };
}
