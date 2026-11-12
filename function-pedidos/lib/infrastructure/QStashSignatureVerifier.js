import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { UnauthorizedError } from '../domain/errors.js';

const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const decode = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

/**
 * Confere o cabeçalho Upstash-Signature (JWT HS256) enviado pelo QStash:
 * assinatura com a chave atual ou a próxima, emissor "Upstash", validade
 * (exp/nbf) e o hash SHA-256 do corpo. Implementação sem SDK.
 */
export class QStashSignatureVerifier {
  constructor({ currentKey, nextKey, now = () => Date.now() }) {
    this.keys = [currentKey, nextKey].filter(Boolean);
    this.now = now;
  }

  async verify({ rawBody, signature }) {
    if (!signature) throw new UnauthorizedError('Cabeçalho Upstash-Signature ausente.');
    const [header, payload, sig] = String(signature).split('.');
    if (!header || !payload || !sig) throw new UnauthorizedError('Assinatura malformada.');

    const valida = this.keys.some((key) => {
      const esperado = Buffer.from(b64url(createHmac('sha256', key).update(`${header}.${payload}`).digest()));
      const recebido = Buffer.from(sig.replace(/=+$/, ''));
      return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
    });
    if (!valida) throw new UnauthorizedError('Assinatura do QStash inválida.');

    const claims = decode(payload);
    const agora = Math.floor(this.now() / 1000);
    if (claims.iss !== 'Upstash') throw new UnauthorizedError('Emissor inválido.');
    if (typeof claims.exp === 'number' && agora > claims.exp) throw new UnauthorizedError('Assinatura expirada.');
    if (typeof claims.nbf === 'number' && agora < claims.nbf) throw new UnauthorizedError('Assinatura ainda não válida.');
    const hashCorpo = b64url(createHash('sha256').update(rawBody ?? '').digest());
    if (String(claims.body ?? '').replace(/=+$/, '') !== hashCorpo) throw new UnauthorizedError('Corpo da mensagem alterado.');
  }
}

/** Usado quando as chaves não estão configuradas (ambiente local/demonstração). */
export class NoSignatureVerifier {
  async verify() {
    console.warn('QSTASH_*_SIGNING_KEY não configuradas: assinatura não verificada.');
  }
}
