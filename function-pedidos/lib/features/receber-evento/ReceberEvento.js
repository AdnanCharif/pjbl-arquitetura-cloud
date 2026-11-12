import { processarEvento } from '../../domain/eventos.js';

/**
 * Caso de uso do Message Trigger: valida a assinatura do broker (porta
 * SignatureVerifier), interpreta o evento e registra a notificação (porta Logger).
 */
export class ReceberEvento {
  constructor({ verifier, logger }) {
    this.verifier = verifier;
    this.logger = logger;
  }

  async execute({ rawBody, signature }) {
    await this.verifier.verify({ rawBody, signature });
    const resultado = processarEvento(JSON.parse(rawBody || '{}'));
    this.logger.info({ tipo: 'evento-recebido', ...resultado });
    return resultado;
  }
}
