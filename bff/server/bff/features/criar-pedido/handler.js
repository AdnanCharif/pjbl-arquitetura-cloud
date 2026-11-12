import { sendJson, handleError } from '../../../shared/http.js';

export function criarPedidoHandler({ criarPedido }) {
  return async (req, res) => {
    try {
      const { status, body } = await criarPedido.execute(req.body);
      sendJson(res, status, body);
    } catch (err) {
      handleError(res, err);
    }
  };
}
