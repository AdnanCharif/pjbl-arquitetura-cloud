import { ValidationError } from './errors.js';

/**
 * Regras de negócio do cálculo do pedido (puras, sem HTTP):
 *  - taxa de entrega: R$ 5,00 até 2 km + R$ 1,50 por km adicional (máx. R$ 25,00);
 *  - frete grátis para subtotal a partir de R$ 150,00;
 *  - cupom PJBL10: 10% de desconto no subtotal (limitado a R$ 30,00);
 *  - tempo estimado (ETA): 20 min de preparo + 3 min por km, arredondado para cima.
 */
export const REGRAS = Object.freeze({
  TAXA_BASE: 5,
  KM_INCLUSOS: 2,
  TAXA_POR_KM: 1.5,
  TAXA_MAXIMA: 25,
  FRETE_GRATIS_A_PARTIR_DE: 150,
  CUPONS: { PJBL10: { percentual: 0.1, maximo: 30 } },
  PREPARO_MIN: 20,
  MIN_POR_KM: 3,
});

const round2 = (n) => Math.round(n * 100) / 100;

export function calcularPedido({ itens, distanciaKm = 3, cupom } = {}) {
  if (!Array.isArray(itens) || itens.length === 0) throw new ValidationError('Informe ao menos um item em "itens".');
  itens.forEach((item, i) => {
    if (typeof item?.precoUnitario !== 'number' || item.precoUnitario < 0) {
      throw new ValidationError(`Item ${i + 1}: "precoUnitario" deve ser um número >= 0.`);
    }
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1) {
      throw new ValidationError(`Item ${i + 1}: "quantidade" deve ser um inteiro >= 1.`);
    }
  });
  if (typeof distanciaKm !== 'number' || distanciaKm < 0 || distanciaKm > 50) {
    throw new ValidationError('"distanciaKm" deve ser um número entre 0 e 50.');
  }

  const regrasAplicadas = [];
  const subtotal = round2(itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0));

  let taxaEntrega = REGRAS.TAXA_BASE + Math.max(0, distanciaKm - REGRAS.KM_INCLUSOS) * REGRAS.TAXA_POR_KM;
  taxaEntrega = round2(Math.min(taxaEntrega, REGRAS.TAXA_MAXIMA));
  if (subtotal >= REGRAS.FRETE_GRATIS_A_PARTIR_DE) {
    taxaEntrega = 0;
    regrasAplicadas.push(`Frete grátis (subtotal a partir de R$ ${REGRAS.FRETE_GRATIS_A_PARTIR_DE})`);
  }

  let desconto = 0;
  if (cupom) {
    const regra = REGRAS.CUPONS[String(cupom).trim().toUpperCase()];
    if (!regra) throw new ValidationError(`Cupom "${cupom}" inválido.`);
    desconto = round2(Math.min(subtotal * regra.percentual, regra.maximo));
    regrasAplicadas.push(`Cupom ${String(cupom).toUpperCase()}: -R$ ${desconto.toFixed(2)}`);
  }

  const etaMin = Math.ceil(REGRAS.PREPARO_MIN + distanciaKm * REGRAS.MIN_POR_KM);

  return {
    subtotal,
    taxaEntrega,
    desconto,
    total: round2(subtotal + taxaEntrega - desconto),
    distanciaKm,
    etaMin,
    regrasAplicadas,
  };
}
