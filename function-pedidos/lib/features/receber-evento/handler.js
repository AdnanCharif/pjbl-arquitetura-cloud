import { sendJson, handleError, allowMethods, readRawBody } from '../../shared/http.js';
import { CATALOGO } from '../../domain/eventos.js';

export function receberEventoHandler({ receberEvento }) {
  return async (req, res) => {
    if (!allowMethods(req, res, ['GET', 'POST'])) return;
    if (req.method === 'GET') {
      // Catálogo de eventos aceitos (documentação viva para o arc42 / Swagger de eventos)
      return sendJson(res, 200, Object.entries(CATALOGO).map(([evento, { produtor }]) => ({ evento, produtor })));
    }
    try {
      const rawBody = await readRawBody(req);
      const resultado = await receberEvento.execute({ rawBody, signature: req.headers['upstash-signature'] });
      sendJson(res, 200, { recebido: true, ...resultado });
    } catch (err) {
      if (err instanceof SyntaxError) return sendJson(res, 400, { error: 'JSON inválido.' });
      handleError(res, err);
    }
  };
}
