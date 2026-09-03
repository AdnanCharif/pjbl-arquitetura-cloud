function RestaurantList({ restaurants, onSelect }) {
  return (
    <div className="movie-grid">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="movie-card"
          onClick={() => onSelect(restaurant.id)}
        >
          <img src={restaurant.image} alt={restaurant.name} />
          <span className="badge">★ {restaurant.rating}</span>
          <h3>{restaurant.name}</h3>
          <p>{restaurant.category} · {restaurant.deliveryTime}</p>
        </div>
      ))}
    </div>
  );
}

export default RestaurantList;