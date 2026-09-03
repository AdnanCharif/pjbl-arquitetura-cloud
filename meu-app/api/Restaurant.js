export default function handler(req, res) {
  const restaurants = [
    {
      id: 1,
      name: "Sushi Kazu",
      category: "Japonesa",
      deliveryTime: "35-45 min",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400",
      menu: [
        { id: 1, name: "Combinado 20 peças", price: 59.9, description: "Sashimi, niguiri e hossomaki variados" },
        { id: 2, name: "Temaki salmão", price: 24.9, description: "Cone de alga com arroz, salmão e cream cheese" }
      ]
    },
    {
      id: 2,
      name: "Pizzaria do Bairro",
      category: "Pizza",
      deliveryTime: "40-50 min",
      rating: 4.6,
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400",
      menu: [
        { id: 1, name: "Pizza Margherita", price: 45.0, description: "Molho de tomate, mussarela e manjericão" },
        { id: 2, name: "Pizza Calabresa", price: 48.0, description: "Calabresa fatiada, cebola e mussarela" }
      ]
    },
    {
      id: 3,
      name: "Burger House",
      category: "Hambúrguer",
      deliveryTime: "25-35 min",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
      menu: [
        { id: 1, name: "Cheeseburger duplo", price: 32.9, description: "Dois hambúrgueres, cheddar e molho especial" },
        { id: 2, name: "Batata frita grande", price: 15.9, description: "Porção generosa com tempero da casa" }
      ]
    },
    {
      id: 4,
      name: "Sabor Mineiro",
      category: "Brasileira",
      deliveryTime: "45-55 min",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
      menu: [
        { id: 1, name: "Feijão tropeiro", price: 28.0, description: "Prato individual com arroz e couve" },
        { id: 2, name: "Frango com quiabo", price: 30.0, description: "Acompanha arroz e farofa" }
      ]
    }
  ];

  res.status(200).json(restaurants);
}