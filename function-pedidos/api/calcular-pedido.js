// HTTP Trigger — POST /api/calcular-pedido
import { calcularPedido } from '../lib/composition.js';

export default function handler(req, res) {
  return calcularPedido(req, res);
}
