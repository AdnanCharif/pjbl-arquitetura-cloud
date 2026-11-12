import { ValidationError, UnauthorizedError } from '../domain/errors.js';

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(body));
}

/** Responde CORS preflight e 405; devolve true quando o método é aceito. */
export function allowMethods(req, res, methods) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.end();
    return false;
  }
  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    sendJson(res, 405, { error: 'Método não permitido.' });
    return false;
  }
  return true;
}

/**
 * Corpo bruto da requisição (necessário para conferir a assinatura do QStash).
 * Na Vercel, ler o stream antes de tocar em req.body preserva os bytes originais.
 */
export async function readRawBody(req) {
  if (typeof req.rawBody === 'string') return req.rawBody;
  if (req.readable) {
    const chunks = [];
    for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    if (chunks.length) return Buffer.concat(chunks).toString('utf8');
  }
  if (req.body === undefined || req.body === null) return '';
  return typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
}

export function handleError(res, err) {
  if (err instanceof ValidationError) return sendJson(res, 400, { error: err.message });
  if (err instanceof UnauthorizedError) return sendJson(res, 401, { error: err.message });
  console.error(err);
  return sendJson(res, 500, { error: 'Erro interno do servidor.' });
}
