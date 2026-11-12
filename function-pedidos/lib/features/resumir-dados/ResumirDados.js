import { resumirDados } from '../../domain/resumo.js';

/** Caso de uso: enriquecimento dos dados agregados pelo BFF (indicadores do painel). */
export class ResumirDados {
  execute(input) {
    return resumirDados(input);
  }
}
