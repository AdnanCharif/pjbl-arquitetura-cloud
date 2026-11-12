// Message Trigger — POST /api/eventos, chamado pelo Upstash QStash a cada evento de domínio.
// GET devolve o catálogo de eventos aceitos.
import { receberEvento } from '../lib/composition.js';

export default function handler(req, res) {
  return receberEvento(req, res);
}
