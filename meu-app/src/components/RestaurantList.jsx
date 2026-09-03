function RestaurantList({ restaurants, onSelect }) {
  return (
    <div className="restaurant-grid">
      {restaurants.map((restaurant) => (
        <div
          key={restaurant.id}
          className="restaurant-card"
          onClick={() => onSelect(restaurant.id)}
        >
          <img src={restaurant.image} alt={restaurant.name} />
          <h3>{restaurant.name}</h3>
          <p>{restaurant.category} • {restaurant.deliveryTime}</p>
        </div>
      ))}
    </div>
  );
}

export default RestaurantList;