import { UpstreamError } from '../domain/errors.js';

/**
 * Cliente HTTP (fetch nativo) com tempo-limite. Respostas fora de 2xx viram
 * UpstreamError com o status e a mensagem do serviço chamado, exceto os
 * status listados em `accept`, que são devolvidos ao chamador.
 */
export class HttpClient {
  constructor({ service, baseUrl, timeoutMs = 30000, fetchFn = globalThis.fetch }) {
    if (!baseUrl) throw new Error(`URL do serviço "${service}" não configurada.`);
    this.service = service;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.fetch = fetchFn;
  }

  async request(method, path, { body, query, accept = [] } = {}) {
    const qs = new URLSearchParams(Object.entries(query ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    const url = `${this.baseUrl}${path}${qs.size ? `?${qs}` : ''}`;
    let res;
    try {
      res = await this.fetch(url, {
        method,
        headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      const timeout = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      throw new UpstreamError({
        service: this.service,
        status: timeout ? 504 : 502,
        message: timeout ? `${this.service} não respondeu em ${this.timeoutMs} ms.` : `${this.service} indisponível: ${err.message}`,
      });
    }
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { error: text.slice(0, 200) };
    }
    if (res.ok || accept.includes(res.status)) return { status: res.status, data };
    throw new UpstreamError({ service: this.service, status: res.status, body: data });
  }
}
