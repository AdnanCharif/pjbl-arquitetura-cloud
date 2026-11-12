import { sendJson, handleError } from '../../../shared/http.js';

/** CONFIRMADO → 201 · EXISTENTE (idempotência) → 200 · RECUSADO → 402 · INDISPONIVEL → 503 */
const STATUS_HTTP = { CONFIRMADO: 201, EXISTENTE: 200, RECUSADO: 402, INDISPONIVEL: 503 };

export function criarPedidoHandler({ criarPedido }) {
  return async (req, res) => {
    try {
      const { pedido, resultado } = await criarPedido.execute(req.body);
      sendJson(res, STATUS_HTTP[resultado], pedido);
    } catch (err) {
      handleError(res, err);
    }
  };
}
