import { useState } from "react";
import { api, money } from "../api";
import { useResource } from "../hooks";

const vazio = { name: "", category: "", deliveryTime: "30-40 min", rating: 4.5, image: "", menu: [{ name: "", description: "", price: 0 }] };

/** Painel do restaurante (MFE Gestão de Cardápio): CRUD completo via BFF. */
function ManageRestaurants() {
  const { data: restaurantes, loading, error, reload } = useResource("/restaurants");
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState(null);

  const set = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }));
  const setItem = (i, campo, valor) => setForm((f) => ({ ...f, menu: f.menu.map((m, j) => (j === i ? { ...m, [campo]: valor } : m)) }));

  async function salvar(e) {
    e.preventDefault();
    setMsg(null);
    const { id, ...dados } = form;
    const body = {
      ...dados,
      rating: Number(dados.rating),
      menu: dados.menu.filter((m) => m.name.trim()).map((m) => ({ ...m, price: Number(m.price) })),
    };
    try {
      if (id) await api("PUT", `/restaurants/${id}`, body);
      else await api("POST", "/restaurants", body);
      setMsg({ ok: true, texto: id ? "Restaurante alterado." : "Restaurante cadastrado." });
      setForm(null);
      reload();
    } catch (err) {
      setMsg({ ok: false, texto: err.message });
    }
  }

  async function excluir(r) {
    if (!window.confirm(`Excluir "${r.name}"?`)) return;
    try {
      await api("DELETE", `/restaurants/${r.id}`);
      setMsg({ ok: true, texto: "Restaurante excluído." });
      reload();
    } catch (err) {
      setMsg({ ok: false, texto: err.message });
    }
  }

  return (
    <section>
      <div className="toolbar">
        <h2>Gestão de restaurantes</h2>
        <button className="btn" onClick={() => setForm(structuredClone(vazio))}>Novo restaurante</button>
      </div>
      {msg && <p className={`status ${msg.ok ? "" : "error"}`}>{msg.texto}</p>}

      {form && (
        <form className="card-form" onSubmit={salvar}>
          <h3>{form.id ? "Alterar restaurante" : "Novo restaurante"}</h3>
          <div className="form-grid">
            <label>Nome<input value={form.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label>Categoria<input value={form.category} onChange={(e) => set("category", e.target.value)} /></label>
            <label>Tempo de entrega<input value={form.deliveryTime} onChange={(e) => set("deliveryTime", e.target.value)} /></label>
            <label>Nota (0 a 5)<input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => set("rating", e.target.value)} /></label>
            <label className="wide">URL da imagem<input value={form.image} onChange={(e) => set("image", e.target.value)} /></label>
          </div>
          <h4>Cardápio</h4>
          {form.menu.map((m, i) => (
            <div key={i} className="menu-row">
              <input placeholder="Item" value={m.name} onChange={(e) => setItem(i, "name", e.target.value)} />
              <input placeholder="Descrição" value={m.description} onChange={(e) => setItem(i, "description", e.target.value)} />
              <input type="number" step="0.01" min="0" placeholder="Preço" value={m.price} onChange={(e) => setItem(i, "price", e.target.value)} />
              <button type="button" className="btn small ghost" onClick={() => setForm((f) => ({ ...f, menu: f.menu.filter((_, j) => j !== i) }))}>Remover</button>
            </div>
          ))}
          <button type="button" className="btn small ghost" onClick={() => setForm((f) => ({ ...f, menu: [...f.menu, { name: "", description: "", price: 0 }] }))}>+ Item</button>
          <div className="row">
            <button className="btn">Salvar</button>
            <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancelar</button>
          </div>
        </form>
      )}

      {loading && <p className="status">Carregando...</p>}
      {error && <p className="status error">Erro: {error}</p>}
      <table className="table">
        <thead><tr><th>Nome</th><th>Categoria</th><th>Nota</th><th>Itens</th><th>Faixa de preço</th><th /></tr></thead>
        <tbody>
          {restaurantes?.map((r) => {
            const precos = r.menu.map((m) => m.price);
            return (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.category}</td>
                <td>★ {r.rating}</td>
                <td>{r.menu.length}</td>
                <td>{precos.length ? `${money(Math.min(...precos))} a ${money(Math.max(...precos))}` : "—"}</td>
                <td className="actions">
                  <button className="btn small ghost" onClick={() => setForm({ ...structuredClone(r), menu: r.menu.length ? structuredClone(r.menu) : vazio.menu })}>Editar</button>
                  <button className="btn small ghost" onClick={() => excluir(r)}>Excluir</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export default ManageRestaurants;
