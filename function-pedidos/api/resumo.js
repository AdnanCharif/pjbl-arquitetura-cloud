// HTTP Trigger — POST /api/resumo (enriquecimento de dados para o /aggregated-data do BFF)
import { resumirDados } from '../lib/composition.js';

export default function handler(req, res) {
  return resumirDados(req, res);
}
