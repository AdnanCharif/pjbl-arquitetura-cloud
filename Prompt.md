# Prompt utilizado para gerar o frontend

Ferramenta de IA utilizada: Claude (Anthropic)

## Prompt

```
Crie um frontend em React (usando Vite) para um aplicativo de delivery
chamado "Prato", com duas telas:

1. Catálogo de restaurantes: uma tela inicial que lista restaurantes em
   formato de grade de cards, mostrando imagem, nome, categoria, tempo de
   entrega estimado e nota de avaliação. Os dados devem vir de uma
   requisição GET para um endpoint "/api/restaurants".

2. Detalhes do restaurante: ao clicar em um card da lista, o usuário deve
   ver uma tela com as informações completas do restaurante selecionado
   (nome, categoria, tempo de entrega, nota) e o cardápio do restaurante,
   listando os itens com nome, descrição e preço. Deve haver um botão para
   voltar à lista.

Requisitos técnicos:
- Não usar bibliotecas de rotas (react-router); a navegação entre as duas
  telas deve ser controlada por estado (useState) dentro do componente App.
- Separar os componentes em arquivos próprios: RestaurantList.jsx e
  RestaurantDetail.jsx, dentro de uma pasta components.
- Tratar estados de carregamento (loading) e erro na busca dos dados.
- Criar também o backend mock correspondente como uma Azure Function (HTTP
  trigger, método GET, autenticação anônima), retornando uma lista de
  restaurantes em JSON com dados fictícios, incluindo um array de itens de
  cardápio (menu) para cada restaurante.
- Aplicar um visual próprio ao projeto, com um estilo escuro e elegante,
  como um cardápio de restaurante, evitando um layout genérico de SaaS.
```

## Ajustes feitos manualmente após a geração

- Correção de nomes de variáveis e props que ficaram inconsistentes durante
  a adaptação de um tema inicial (catálogo de filmes) para o tema final
  (catálogo de restaurantes).
- Criação de uma segunda versão da API, compatível com o formato de funções
  serverless da Vercel, devido à indisponibilidade do Azure Static Web Apps
  na conta de estudante do grupo (detalhes no README.md).
- Ajustes de estilo (paleta de cores, tipografia e espaçamento) para dar
  identidade visual própria ao projeto.
