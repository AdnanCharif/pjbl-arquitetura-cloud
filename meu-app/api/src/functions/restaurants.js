const { app } = require("@azure/functions");

// Dados mockados (poderiam vir do Apidog também, trocando isto
// por um fetch() para a URL do mock do Apidog)
const movies = [
  {
    id: 1,
    title: "Interestelar",
    year: 2014,
    genre: "Ficção científica",
    director: "Christopher Nolan",
    rating: 8.6,
    poster: "https://upload.wikimedia.org/wikipedia/pt/9/9e/Interstellar_Filme.png",
    synopsis:
      "Um grupo de exploradores usa uma passagem recém-descoberta no espaço-tempo para superar os limites da viagem espacial humana e conquistar distâncias astronômicas antes inimagináveis."
  },
  {
    id: 2,
    title: "A Origem",
    year: 2010,
    genre: "Ficção científica",
    director: "Christopher Nolan",
    rating: 8.4,
    poster: "https://upload.wikimedia.org/wikipedia/pt/6/60/A_Origem.jpg",
    synopsis:
      "Um ladrão que rouba segredos corporativos através do uso da tecnologia de compartilhamento de sonhos recebe a missão de plantar uma ideia na mente de um executivo."
  },
  {
    id: 3,
    title: "Divertida Mente",
    year: 2015,
    genre: "Animação",
    director: "Pete Docter",
    rating: 8.1,
    poster: "https://upload.wikimedia.org/wikipedia/pt/0/0a/Divertida_Mente_p%C3%B4ster.jpg",
    synopsis:
      "Depois que a jovem Riley é desenraizada de sua vida no Centro-Oeste quando seu pai começa um novo emprego, suas emoções entram em conflito sobre como lidar com um novo lugar."
  },
  {
    id: 4,
    title: "Duna",
    year: 2021,
    genre: "Ficção científica",
    director: "Denis Villeneuve",
    rating: 8.0,
    poster: "https://upload.wikimedia.org/wikipedia/pt/8/8d/Duna_%282021%29.png",
    synopsis:
      "Paul Atreides, um jovem brilhante e talentoso nascido em um grande destino, deve viajar para o planeta mais perigoso do universo para garantir o futuro de sua família e seu povo."
  }
];

app.http("movies", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "movies",
  handler: async () => {
    return {
      jsonBody: movies,
      headers: { "Content-Type": "application/json" }
    };
  }
});