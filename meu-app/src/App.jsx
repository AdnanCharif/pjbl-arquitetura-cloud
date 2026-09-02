import { useState, useEffect } from "react";
import MovieList from "./components/MovieList";
import MovieDetail from "./components/MovieDetail";
import "./App.css";

// URL da Azure Function. Durante o desenvolvimento local, o SWA CLI
// expoe a API em /api automaticamente. Depois de publicar, o mesmo
// caminho "/api/movies" continua funcionando porque o Static Web Apps
// roteia /api/* para a Function associada.
const API_URL = "/api/movies";

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Erro ao buscar filmes");
        return res.json();
      })
      .then((data) => {
        setMovies(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const selectedMovie = movies.find((m) => m.id === selectedId);

  return (
    <div className="app">
      <header className="header">
        <h1>🎬 Catálogo de Filmes</h1>
      </header>

      {loading && <p className="status">Carregando filmes...</p>}
      {error && <p className="status error">Erro: {error}</p>}

      {!loading && !error && (
        <>
          {selectedMovie ? (
            <MovieDetail
              movie={selectedMovie}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <MovieList movies={movies} onSelect={setSelectedId} />
          )}
        </>
      )}
    </div>
  );
}

export default App;
