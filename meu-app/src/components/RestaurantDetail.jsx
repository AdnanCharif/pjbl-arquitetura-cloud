function RestaurantDetail({ restaurant, onBack }) {
  return (
    <div className="movie-detail">
      <button className="back-button" onClick={onBack}>
        ← Voltar
      </button>
      <div className="detail-content">
        <img src={restaurant.image} alt={restaurant.name} />
        <div>
          <h2>{restaurant.name}</h2>
          <p><strong>Categoria:</strong> {restaurant.category}</p>
          <p><strong>Tempo de entrega:</strong> {restaurant.deliveryTime}</p>
          <p><strong>Nota:</strong> {restaurant.rating} / 5</p>

          <h3 style={{ marginTop: 24 }}>Cardápio</h3>
          <ul className="menu-list">
            {restaurant.menu.map((item) => (
              <li key={item.id} className="menu-item">
                <div>
                  <strong>{item.name}</strong>
                  <p className="synopsis" style={{ margin: "4px 0" }}>
                    {item.description}
                  </p>
                </div>
                <span>R$ {item.price.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default RestaurantDetail;