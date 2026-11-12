import { useState } from "react";
import { money, STATUS_LABEL } from "../api";
import { useResource } from "../hooks";

/** Consome o endpoint obrigatório GET /aggregated-data do BFF. */
function Dashboard() {
  const { data, loading, error, reload } = useResource("/aggregated-data");
  const [verJson, setVerJson] = useState(false);
  const r = data?.resumo;

  return (
    <section>
      <div className="toolbar">
        <h2>Painel — GET /aggregated-data</h2>
        <button className="btn ghost" onClick={reload}>Atualizar</button>
        <button className="btn ghost" onClick={() => setVerJson((v) => !v)}>{verJson ? "Ocultar JSON" : "Ver JSON único"}</button>
      </div>
      {loading && <p className="status">Consultando BFF (MS Restaurantes + MS Pedidos + Function)...</p>}
      {error && <p className="status error">Erro: {error}</p>}

      {data && (
        <>
          <div className="sources">
            {Object.entries(data.fontes).map(([k, f]) => (
              <div key={k} className={`source ${f.ok ? "ok" : "fail"}`}>
                <strong>{f.servico}</strong>
                <span>{f.banco ?? "serverless"}</span>
                <span>{f.ok ? `OK · ${f.tempoMs} ms` : `Falhou: ${f.erro}`}</span>
              </div>
            ))}
          </div>

          {r && (
            <div className="kpis">
              <div><span>Restaurantes</span><strong>{r.totalRestaurantes}</strong></div>
              <div><span>Pedidos</span><strong>{r.totalPedidos}</strong></div>
              <div><span>Faturamento</span><strong>{money(r.faturamento)}</strong></div>
              <div><span>Ticket médio</span><strong>{money(r.ticketMedio)}</strong></div>
              <div><span>Nota média</span><strong>{r.notaMediaRestaurantes ?? "—"}</strong></div>
              <div><span>Mais pedido</span><strong>{r.restauranteMaisPedido?.nome ?? "—"}</strong></div>
            </div>
          )}

          {r && Object.keys(r.pedidosPorStatus).length > 0 && (
            <p className="muted">
              Pedidos por status: {Object.entries(r.pedidosPorStatus).map(([s, n]) => `${STATUS_LABEL[s] ?? s}: ${n}`).join(" · ")}
            </p>
          )}

          <table className="table">
            <thead><tr><th>Pedido</th><th>Restaurante (enriquecido pela Function)</th><th>Status</th><th>Itens</th><th>Total</th></tr></thead>
            <tbody>
              {data.pedidos.map((p) => (
                <tr key={p.id}>
                  <td>#{p.id.slice(0, 8)}</td>
                  <td>{p.restauranteNome ?? p.restauranteId}</td>
                  <td><span className={`pill s-${p.status}`}>{STATUS_LABEL[p.status] ?? p.status}</span></td>
                  <td>{p.quantidadeItens ?? "—"}</td>
                  <td>{money(p.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {verJson && <pre className="json">{JSON.stringify(data, null, 2)}</pre>}
          <p className="muted">Gerado em {new Date(data.geradoEm).toLocaleString("pt-BR")}</p>
        </>
      )}
    </section>
  );
}

export default Dashboard;
