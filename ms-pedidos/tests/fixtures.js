/** Dados de exemplo compartilhados pelos testes. */
export const entrada = (over = {}) => ({
  clienteId: 'cliente-1',
  restauranteId: 'rest-1',
  itens: [
    { itemCardapioId: 1, nome: ' Combinado ', precoUnitario: 59.9, quantidade: 2 },
    { itemCardapioId: 2, nome: 'Temaki', precoUnitario: 24.9, quantidade: 1 },
  ],
  enderecoEntrega: { rua: 'Rua A', numero: '10', cidade: 'Curitiba' },
  taxaEntrega: 7.5,
  desconto: 5,
  ...over,
});
