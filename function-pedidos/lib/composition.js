import { CalcularPedido } from './features/calcular-pedido/CalcularPedido.js';
import { ResumirDados } from './features/resumir-dados/ResumirDados.js';
import { ReceberEvento } from './features/receber-evento/ReceberEvento.js';
import { calcularPedidoHandler } from './features/calcular-pedido/handler.js';
import { resumirDadosHandler } from './features/resumir-dados/handler.js';
import { receberEventoHandler } from './features/receber-evento/handler.js';
import { QStashSignatureVerifier, NoSignatureVerifier } from './infrastructure/QStashSignatureVerifier.js';
import { ConsoleLogger } from './infrastructure/ConsoleLogger.js';

/** Composition Root das funções: único ponto que conhece a infraestrutura. */
export function buildVerifier(env = process.env) {
  return env.QSTASH_CURRENT_SIGNING_KEY
    ? new QStashSignatureVerifier({ currentKey: env.QSTASH_CURRENT_SIGNING_KEY, nextKey: env.QSTASH_NEXT_SIGNING_KEY })
    : new NoSignatureVerifier();
}

export const calcularPedido = calcularPedidoHandler({ calcularPedido: new CalcularPedido() });
export const resumirDados = resumirDadosHandler({ resumirDados: new ResumirDados() });
export const receberEvento = receberEventoHandler({
  receberEvento: new ReceberEvento({ verifier: buildVerifier(), logger: new ConsoleLogger() }),
});
