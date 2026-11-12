import { useState } from "react";
import RestaurantList from "../components/RestaurantList";
import RestaurantDetail from "../components/RestaurantDetail";
import { useResource } from "../hooks";

function Catalog({ onOrderCreated }) {
  const [q, setQ] = useState("");
  const [busca, setBusca] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const { data: restaurants, loading, error } = useResource(`/restaurants${busca ? `?q=${encodeURIComponent(busca)}` : ""}`);

  const selected = restaurants?.find((r) => r.id === selectedId);
  if (selected) {
    return <RestaurantDetail restaurant={selected} onBack={() => setSelectedId(null)} onOrderCreated={onOrderCreated} />;
  }

  return (
    <>
      <form className="search" onSubmit={(e) => { e.preventDefault(); setBusca(q.trim()); }}>
        <input placeholder="Buscar restaurante pelo nome..." value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn">Buscar</button>
      </form>
      {loading && <p className="status">Carregando restaurantes...</p>}
      {error && <p className="status error">Erro: {error}</p>}
      {!loading && !error && restaurants?.length === 0 && <p className="status">Nenhum restaurante encontrado.</p>}
      {!loading && !error && <RestaurantList restaurants={restaurants ?? []} onSelect={setSelectedId} />}
    </>
  );
}

export default Catalog;
