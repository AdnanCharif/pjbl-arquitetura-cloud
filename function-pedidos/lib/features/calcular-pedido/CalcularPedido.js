import { calcularPedido } from '../../domain/calculo.js';

/** Caso de uso: cálculo e enriquecimento do pedido (subtotal, frete, desconto, ETA). */
export class CalcularPedido {
  execute(input) {
    return calcularPedido(input);
  }
}
