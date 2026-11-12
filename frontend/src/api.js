/**
 * Cliente HTTP do frontend. O frontend fala APENAS com o API Gateway (Zuplo),
 * que encaminha para o BFF. Nunca chama os microserviços diretamente.
 *
 * VITE_API_URL  → URL do gateway (ex.: https://pjbl-gateway-main-xxxx.zuplo.app)
 * VITE_API_KEY  → chave de consumidor criada no Zuplo (enviada como Bearer)
 */
export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const API_KEY = import.meta.env.VITE_API_KEY;

export async function api(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok && ![402, 503].includes(res.status)) {
    throw new Error(data?.error ?? data?.message ?? `Erro ${res.status}`);
  }
  return { status: res.status, data };
}

export const get = async (path) => (await api('GET', path)).data;
export const money = (n) => `R$ ${Number(n ?? 0).toFixed(2).replace('.', ',')}`;

export const STATUS_LABEL = {
  PENDENTE: 'Pendente',
  CONFIRMADO: 'Confirmado',
  FALHA_PAGAMENTO: 'Pagamento recusado',
  EM_PREPARO: 'Em preparo',
  EM_ENTREGA: 'Em entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export const PROXIMO_STATUS = { CONFIRMADO: 'EM_PREPARO', EM_PREPARO: 'EM_ENTREGA', EM_ENTREGA: 'ENTREGUE' };
