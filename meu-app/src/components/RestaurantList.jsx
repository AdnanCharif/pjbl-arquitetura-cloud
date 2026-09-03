function RestaurantList({ restaurants, onSelect }) {
  return (
    <div className="restaurant-grid">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="restaurant-card"
          onClick={() => onSelect(restaurant.id)}
        >
          <img src={restaurant.poster} alt={restaurant.title} />
          <h3>{restaurant.title}</h3>
          <p>{restaurant.year}</p>
        </div>
      ))}
    </div>
  );
}

export default RestaurantList;