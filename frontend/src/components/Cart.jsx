import { useEffect, useMemo, useState } from "react";
import { api, money, STATUS_LABEL } from "../api";
import { clienteId } from "../hooks";

/**
 * Carrinho: a prévia do total vem da Function (via BFF /pedidos/simular) e o
 * pedido é criado no BFF, que chama a Function e o Microserviço de Pedidos.
 */
function Cart({ restaurant, cart, onAdd, onRemove, onClear, onOrderCreated }) {
  const [distanciaKm, setDistanciaKm] = useState(3);
  const [cupom, setCupom] = useState("");
  const [endereco, setEndereco] = useState("Rua Imaculada Conceição, 1155 — Curitiba");
  const [calculoBruto, setCalculo] = useState(null);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const linhas = Object.values(cart);
  const itens = useMemo(
    () => linhas.map(({ item, quantidade }) => ({ itemCardapioId: item.id, nome: item.name, precoUnitario: item.price, quantidade })),
    [linhas],
  );
  const chave = JSON.stringify([itens, distanciaKm, cupom]);
  const calculo = itens.length ? calculoBruto : null;

  useEffect(() => {
    if (itens.length === 0) return undefined;
    const t = setTimeout(() => {
      api("POST", "/pedidos/simular", { itens, distanciaKm: Number(distanciaKm), cupom: cupom || undefined })
        .then(({ data }) => { setCalculo(data); setErro(null); })
        .catch((e) => { setCalculo(null); setErro(e.message); });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);

  if (linhas.length === 0 && !resultado) return null;

  async function fazerPedido() {
    setEnviando(true);
    setErro(null);
    try {
      const { status, data } = await api("POST", "/pedidos", {
        clienteId: clienteId(),
        restauranteId: restaurant.id,
        itens,
        enderecoEntrega: endereco,
        distanciaKm: Number(distanciaKm),
        cupom: cupom || undefined,
        idempotencyKey: crypto.randomUUID(),
      });
      setResultado({ status, pedido: data.pedido ?? data, calculo: data.calculo });
      if (status === 201) onClear();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }

  if (resultado) {
    const ok = resultado.status === 201;
    return (
      <section className={`cart ${ok ? "ok" : "fail"}`}>
        <h3>{ok ? "Pedido confirmado!" : "Pedido não confirmado"}</h3>
        <p>Status: <strong>{STATUS_LABEL[resultado.pedido.status] ?? resultado.pedido.status}</strong> · Total {money(resultado.pedido.valorTotal)}</p>
        {resultado.calculo && <p>Entrega estimada em {resultado.calculo.etaMin} min.</p>}
        {!ok && <p className="status error">O pagamento foi recusado (valores acima de R$ 500 são recusados na simulação).</p>}
        <div className="row">
          {ok && <button className="btn" onClick={onOrderCreated}>Acompanhar pedido</button>}
          <button className="btn ghost" onClick={() => setResultado(null)}>Novo pedido</button>
        </div>
      </section>
    );
  }

  return (
    <section className="cart">
      <h3>Seu pedido</h3>
      <ul className="cart-lines">
        {linhas.map(({ item, quantidade }) => (
          <li key={item.id}>
            <span>{quantidade}× {item.name}</span>
            <span className="qty">
              <button className="btn small ghost" onClick={() => onRemove(item.id)}>−</button>
              <button className="btn small ghost" onClick={() => onAdd(item)}>+</button>
              {money(item.price * quantidade)}
            </span>
          </li>
        ))}
      </ul>
      <div className="form-grid">
        <label>Endereço de entrega<input value={endereco} onChange={(e) => setEndereco(e.target.value)} /></label>
        <label>Distância (km)<input type="number" min="0" max="50" step="0.5" value={distanciaKm} onChange={(e) => setDistanciaKm(e.target.value)} /></label>
        <label>Cupom<input placeholder="PJBL10" value={cupom} onChange={(e) => setCupom(e.target.value)} /></label>
      </div>
      {calculo && (
        <div className="totals">
          <span>Subtotal {money(calculo.subtotal)}</span>
          <span>Entrega {money(calculo.taxaEntrega)}</span>
          {calculo.desconto > 0 && <span>Desconto −{money(calculo.desconto)}</span>}
          <strong>Total {money(calculo.total)}</strong>
          <span>≈ {calculo.etaMin} min</span>
          {calculo.regrasAplicadas?.map((r) => <em key={r}>{r}</em>)}
        </div>
      )}
      {erro && <p className="status error">Erro: {erro}</p>}
      <button className="btn" disabled={enviando || !calculo || !endereco.trim()} onClick={fazerPedido}>
        {enviando ? "Enviando..." : "Fazer pedido"}
      </button>
    </section>
  );
}

export default Cart;
