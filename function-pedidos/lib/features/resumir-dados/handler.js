import { sendJson, handleError, allowMethods } from '../../shared/http.js';

export function resumirDadosHandler({ resumirDados }) {
  return async (req, res) => {
    if (!allowMethods(req, res, ['POST'])) return;
    try {
      sendJson(res, 200, resumirDados.execute(req.body));
    } catch (err) {
      handleError(res, err);
    }
  };
}
