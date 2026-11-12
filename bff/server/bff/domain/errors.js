export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Erro devolvido por um serviço chamado pelo BFF. O BFF repassa ao frontend
 * o status e a mensagem do serviço (ex.: 400, 404, 409); falha de rede ou
 * timeout vira 502/504.
 */
export class UpstreamError extends Error {
  constructor({ service, status, body, message }) {
    super(message ?? body?.error ?? `${service} respondeu ${status}`);
    this.name = 'UpstreamError';
    this.service = service;
    this.status = status;
    this.body = body;
  }
}
