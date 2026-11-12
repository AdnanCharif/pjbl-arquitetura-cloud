/**
 * Enriquecimento de dados para o painel: recebe as listas vindas dos dois
 * microserviços (via BFF) e devolve indicadores e pedidos com o nome do
 * restaurante (os bancos são separados e não há JOIN entre serviços).
 */
const FATURADOS = ['CONFIRMADO', 'EM_PREPARO', 'EM_ENTREGA', 'ENTREGUE'];
const round2 = (n) => Math.round(n * 100) / 100;

export function resumirDados({ restaurantes = [], pedidos = [] } = {}) {
  const lista = (v) => (Array.isArray(v) ? v : []);
  const rs = lista(restaurantes);
  const ps = lista(pedidos);
  const nomePorId = new Map(rs.map((r) => [String(r.id), r.name]));

  const pedidosPorStatus = ps.reduce((acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }), {});
  const faturados = ps.filter((p) => FATURADOS.includes(p.status));
  const faturamento = round2(faturados.reduce((s, p) => s + (Number(p.valorTotal) || 0), 0));

  const contagem = ps.reduce((acc, p) => acc.set(p.restauranteId, (acc.get(p.restauranteId) ?? 0) + 1), new Map());
  const [topId, topQtd] = [...contagem.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];

  const categorias = rs.reduce((acc, r) => ({ ...acc, [r.category]: (acc[r.category] ?? 0) + 1 }), {});
  const notas = rs.map((r) => r.rating).filter((n) => typeof n === 'number');

  return {
    indicadores: {
      totalRestaurantes: rs.length,
      totalPedidos: ps.length,
      faturamento,
      ticketMedio: faturados.length ? round2(faturamento / faturados.length) : 0,
      notaMediaRestaurantes: notas.length ? round2(notas.reduce((a, b) => a + b, 0) / notas.length) : null,
      pedidosPorStatus,
      restaurantesPorCategoria: categorias,
      restauranteMaisPedido: topId ? { id: topId, nome: nomePorId.get(String(topId)) ?? 'desconhecido', pedidos: topQtd } : null,
    },
    pedidosEnriquecidos: ps.map((p) => ({
      id: p.id,
      status: p.status,
      valorTotal: p.valorTotal,
      criadoEm: p.criadoEm,
      restauranteId: p.restauranteId,
      restauranteNome: nomePorId.get(String(p.restauranteId)) ?? 'restaurante removido',
      quantidadeItens: lista(p.itens).reduce((s, i) => s + (i.quantidade ?? 0), 0),
    })),
    geradoEm: new Date().toISOString(),
  };
}
