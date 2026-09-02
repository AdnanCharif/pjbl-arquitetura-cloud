function MovieList({ movies, onSelect }) {
  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <div
          key={movie.id}
          className="movie-card"
          onClick={() => onSelect(movie.id)}
        >
          <img src={movie.poster} alt={movie.title} />
          <h3>{movie.title}</h3>
          <p>{movie.year}</p>
        </div>
      ))}
    </div>
  );
}

export default MovieList;