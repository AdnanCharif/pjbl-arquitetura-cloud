function RestaurantDetail({ restaurant, onBack }) {
  return (
    <div className="restaurant-detail">
      <button className="back-button" onClick={onBack}>
        ← Voltar
      </button>
      <div className="detail-content">
        <img src={restaurant.poster} alt={restaurant.title} />
        <div>
          <h2>{restaurant.title} ({restaurant.year})</h2>
          <p><strong>Gênero:</strong> {restaurant.genre}</p>
          <p><strong>Diretor:</strong> {restaurant.director}</p>
          <p><strong>Nota:</strong> {restaurant.rating} / 10</p>
          <p className="synopsis">{restaurant.synopsis}</p>
        </div>
      </div>
    </div>
  );
}

export default RestaurantDetail;