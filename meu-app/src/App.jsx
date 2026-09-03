import { useState, useEffect } from "react";
import RestaurantList from "./components/RestaurantList";
import RestaurantDetail from "./components/RestaurantDetail";
import "./App.css";

// URL da Azure Function. Durante o desenvolvimento local, o SWA CLI
// expoe a API em /api automaticamente. Depois de publicar, o mesmo
// caminho "/api/movies" continua funcionando porque o Static Web Apps
// roteia /api/* para a Function associada.
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

  const selectedRestaurant = restaurants.find((m) => m.id === selectedId);

  return (
    <div className="app">
      <header className="header">
        <h1>Delivery App</h1>
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
