import { sendJson, handleError } from '../../../shared/http.js';

export function obterDadosAgregadosHandler({ obterDadosAgregados }) {
  return async (_req, res) => {
    try {
      sendJson(res, 200, await obterDadosAgregados.execute());
    } catch (err) {
      handleError(res, err);
    }
  };
}
