import { ValidationError, NotFoundError } from '../restaurants/domain/errors.js';

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  sendJson(res, 405, { error: 'Método não permitido.' });
}

/** Converte exceções de domínio em respostas HTTP. */
export function handleError(res, err) {
  if (err instanceof ValidationError) return sendJson(res, 400, { error: err.message });
  if (err instanceof NotFoundError) return sendJson(res, 404, { error: err.message });
  console.error(err);
  return sendJson(res, 500, { error: 'Erro interno do servidor.' });
}
