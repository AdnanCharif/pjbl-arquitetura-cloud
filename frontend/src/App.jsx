import { useState } from "react";
import Catalog from "./pages/Catalog";
import Orders from "./pages/Orders";
import ManageRestaurants from "./pages/ManageRestaurants";
import Dashboard from "./pages/Dashboard";
import { API_URL } from "./api";
import "./App.css";

const TABS = [
  { id: "catalogo", label: "Catálogo" },
  { id: "pedidos", label: "Meus pedidos" },
  { id: "gestao", label: "Gestão de restaurantes" },
  { id: "painel", label: "Painel (aggregated-data)" },
];

function App() {
  const [tab, setTab] = useState("catalogo");

  return (
    <div className="app">
      <header className="header">
        <h1>Prato</h1>
        <p>FastFood Delivery — escolha um restaurante, monte o pedido e acompanhe a entrega</p>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? "tab active" : "tab"} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "catalogo" && <Catalog onOrderCreated={() => setTab("pedidos")} />}
      {tab === "pedidos" && <Orders />}
      {tab === "gestao" && <ManageRestaurants />}
      {tab === "painel" && <Dashboard />}

      <footer className="footer">
        Todas as chamadas passam pelo API Gateway → BFF: <code>{API_URL}</code>
      </footer>
    </div>
  );
}

export default App;
