import { sendJson, handleError, allowMethods } from '../../shared/http.js';

export function calcularPedidoHandler({ calcularPedido }) {
  return async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;
    try {
      sendJson(res, 200, calcularPedido.execute(req.body));
    } catch (err) {
      handleError(res, err);
    }
  };
}
