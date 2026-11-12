import { sendJson, handleError } from '../../../shared/http.js';

export function simularPedidoHandler({ simularPedido }) {
  return async (req, res) => {
    try {
      sendJson(res, 200, await simularPedido.execute(req.body ?? {}));
    } catch (err) {
      handleError(res, err);
    }
  };
}
