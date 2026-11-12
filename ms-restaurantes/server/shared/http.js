import { ValidationError, NotFoundError } from '../restaurants/domain/errors.js';

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: 'Método não permitido.' });
}

/** Lê o id da rota (Express: req.params; compatível com req.query). */
export function routeId(req) {
  return req.params?.id ?? req.query?.id;
}

/** Converte exceções de domínio em respostas HTTP. */
export function handleError(res, err) {
  if (err instanceof ValidationError) return sendJson(res, 400, { error: err.message });
  if (err instanceof NotFoundError) return sendJson(res, 404, { error: err.message });
  if (err?.type === 'entity.parse.failed') return sendJson(res, 400, { error: 'JSON inválido.' });
  console.error(err);
  return sendJson(res, 500, { error: 'Erro interno do servidor.' });
}
