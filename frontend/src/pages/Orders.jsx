import { useState } from "react";
import { api, money, STATUS_LABEL, PROXIMO_STATUS } from "../api";
import { useResource } from "../hooks";

function Orders() {
  const [filtro, setFiltro] = useState("");
  const { data: pedidos, loading, error, reload } = useResource(`/pedidos${filtro ? `?status=${filtro}` : ""}`);
  const { data: restaurantes } = useResource("/restaurants");
  const [msg, setMsg] = useState(null);

  const nome = (id) => restaurantes?.find((r) => r.id === id)?.name ?? id;

  async function acao(fn, texto) {
    setMsg(null);
    try {
      await fn();
      setMsg({ ok: true, texto });
      reload();
    } catch (e) {
      setMsg({ ok: false, texto: e.message });
    }
  }

  return (
    <section>
      <div className="toolbar">
        <h2>Pedidos</h2>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn ghost" onClick={reload}>Atualizar</button>
      </div>
      {msg && <p className={`status ${msg.ok ? "" : "error"}`}>{msg.texto}</p>}
      {loading && <p className="status">Carregando pedidos...</p>}
      {error && <p className="status error">Erro: {error}</p>}
      {!loading && !error && pedidos?.length === 0 && <p className="status">Nenhum pedido ainda. Monte um no catálogo.</p>}
      <div className="order-list">
        {pedidos?.map((p) => (
          <article key={p.id} className="order">
            <header>
              <strong>{nome(p.restauranteId)}</strong>
              <span className={`pill s-${p.status}`}>{STATUS_LABEL[p.status] ?? p.status}</span>
            </header>
            <p className="muted">#{p.id.slice(0, 8)} · {new Date(p.criadoEm).toLocaleString("pt-BR")} · cliente {p.clienteId}</p>
            <ul>
              {p.itens.map((i, idx) => <li key={idx}>{i.quantidade}× {i.nome} — {money(i.precoUnitario * i.quantidade)}</li>)}
            </ul>
            <p>Subtotal {money(p.subtotal)} · Entrega {money(p.taxaEntrega)} · Desconto {money(p.desconto)} · <strong>Total {money(p.valorTotal)}</strong></p>
            <p className="muted">Histórico: {p.historico.map((h) => STATUS_LABEL[h.status] ?? h.status).join(" → ")}</p>
            <div className="row">
              {PROXIMO_STATUS[p.status] && (
                <button className="btn small" onClick={() => acao(() => api("PUT", `/pedidos/${p.id}`, { status: PROXIMO_STATUS[p.status] }), `Pedido agora ${STATUS_LABEL[PROXIMO_STATUS[p.status]]}.`)}>
                  Avançar para {STATUS_LABEL[PROXIMO_STATUS[p.status]]}
                </button>
              )}
              {["PENDENTE", "CONFIRMADO", "EM_PREPARO"].includes(p.status) && (
                <button className="btn small ghost" onClick={() => acao(() => api("DELETE", `/pedidos/${p.id}`), "Pedido cancelado.")}>Cancelar</button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Orders;
