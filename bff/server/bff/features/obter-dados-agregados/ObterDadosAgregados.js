/**
 * GET /aggregated-data — endpoint obrigatório do enunciado.
 * Consulta em paralelo o Microserviço de Restaurantes (MongoDB) e o de Pedidos
 * (PostgreSQL); em seguida envia os dois à Function, que enriquece os dados.
 * Devolve tudo em um único JSON. Se uma fonte falhar, as demais continuam e
 * o campo "fontes" informa o que aconteceu (degradação parcial).
 */
export class ObterDadosAgregados {
  constructor({ restaurants, orders, fn, clock = () => Date.now() }) {
    this.restaurants = restaurants;
    this.orders = orders;
    this.fn = fn;
    this.clock = clock;
  }

  async #medir(promessa) {
    const inicio = this.clock();
    try {
      return { ok: true, dados: await promessa, ms: this.clock() - inicio };
    } catch (err) {
      return { ok: false, erro: err.message, ms: this.clock() - inicio };
    }
  }

  async execute() {
    const [restaurantes, pedidos] = await Promise.all([
      this.#medir(this.restaurants.list()),
      this.#medir(this.orders.list()),
    ]);
    const resumo = await this.#medir(
      this.fn.resumir({ restaurantes: restaurantes.dados ?? [], pedidos: pedidos.dados ?? [] }),
    );

    const fonte = ({ ok, ms, erro }, servico, banco) => ({ servico, banco, ok, tempoMs: ms, ...(erro ? { erro } : {}) });
    return {
      restaurantes: restaurantes.dados ?? [],
      pedidos: resumo.dados?.pedidosEnriquecidos ?? pedidos.dados ?? [],
      resumo: resumo.dados?.indicadores ?? null,
      fontes: {
        msRestaurantes: fonte(restaurantes, 'Microserviço de Restaurantes', 'MongoDB Atlas'),
        msPedidos: fonte(pedidos, 'Microserviço de Pedidos', 'PostgreSQL (Neon)'),
        function: fonte(resumo, 'Function resumo (Vercel)', null),
      },
      geradoEm: new Date(this.clock()).toISOString(),
    };
  }
}
