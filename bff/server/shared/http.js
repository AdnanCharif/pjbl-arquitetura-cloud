import { ValidationError, UpstreamError } from '../bff/domain/errors.js';

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.send(JSON.stringify(body));
}

/** Converte exceções em respostas HTTP; erros dos serviços são repassados. */
export function handleError(res, err) {
  if (err instanceof ValidationError) return sendJson(res, 400, { error: err.message });
  if (err instanceof UpstreamError) {
    const status = err.status >= 400 && err.status < 600 ? err.status : 502;
    return sendJson(res, status, { error: err.message, servico: err.service });
  }
  if (err?.type === 'entity.parse.failed') return sendJson(res, 400, { error: 'JSON inválido.' });
  console.error(err);
  return sendJson(res, 500, { error: 'Erro interno do servidor.' });
}
