import { useState, useEffect } from "react";
import RestaurantList from "./components/RestaurantList";
import RestaurantDetail from "./components/RestaurantDetail";
import "./App.css";

// URL da Azure Function / função serverless. O mesmo caminho "/api/restaurants"
// funciona tanto no Azure Static Web Apps quanto na Vercel, pois os dois
// roteiam /api/* para a function correspondente.
const API_URL = "/api/restaurants";

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar restaurantes");
        return res.json();
      })
      .then((data) => {
        setRestaurants(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const selectedRestaurant = restaurants.find((r) => r.id === selectedId);

  return (
    <div className="app">
      <header className="header">
        <h1>Restaurantes</h1>
        <p>Escolha um restaurante e veja o cardápio completo</p>
      </header>

      {loading && <p className="status">Carregando restaurantes...</p>}
      {error && <p className="status error">Erro: {error}</p>}

      {!loading && !error && (
        <>
          {selectedRestaurant ? (
            <RestaurantDetail
              restaurant={selectedRestaurant}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <RestaurantList restaurants={restaurants} onSelect={setSelectedId} />
          )}
        </>
      )}
    </div>
  );
}

export default App;