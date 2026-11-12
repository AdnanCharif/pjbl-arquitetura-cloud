import { useState } from "react";
import Cart from "./Cart";
import { money } from "../api";

const FALLBACK = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400";

function RestaurantDetail({ restaurant, onBack, onOrderCreated }) {
  const [cart, setCart] = useState({});

  const add = (item) => setCart((c) => ({ ...c, [item.id]: { item, quantidade: (c[item.id]?.quantidade ?? 0) + 1 } }));
  const remove = (id) =>
    setCart((c) => {
      const q = (c[id]?.quantidade ?? 0) - 1;
      const next = { ...c };
      if (q <= 0) delete next[id];
      else next[id] = { ...c[id], quantidade: q };
      return next;
    });

  return (
    <div className="movie-detail">
      <button className="back-button" onClick={onBack}>← Voltar ao catálogo</button>
      <div className="detail-content">
        <img src={restaurant.image || FALLBACK} alt={restaurant.name} />
        <div className="detail-main">
          <h2>{restaurant.name}</h2>
          <p><strong>Categoria</strong> {restaurant.category}</p>
          <p><strong>Entrega</strong> {restaurant.deliveryTime}</p>
          <p><strong>Nota</strong> {restaurant.rating} de 5</p>

          <h3>Cardápio</h3>
          {restaurant.menu.length === 0 && <p className="status">Cardápio vazio.</p>}
          <ul className="menu-list">
            {restaurant.menu.map((item) => (
              <li key={item.id} className="menu-item">
                <div>
                  <strong>{item.name}</strong>
                  <p className="synopsis">{item.description}</p>
                </div>
                <div className="menu-actions">
                  <span>{money(item.price)}</span>
                  <button className="btn small" onClick={() => add(item)}>Adicionar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Cart restaurant={restaurant} cart={cart} onAdd={add} onRemove={remove} onClear={() => setCart({})} onOrderCreated={onOrderCreated} />
    </div>
  );
}

export default RestaurantDetail;
