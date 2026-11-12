/** Prévia do total antes de confirmar (carrinho do frontend): só chama a Function. */
export class SimularPedido {
  constructor({ fn }) {
    this.fn = fn;
  }

  execute({ itens, distanciaKm, cupom } = {}) {
    return this.fn.calcularPedido({ itens, distanciaKm, cupom });
  }
}
