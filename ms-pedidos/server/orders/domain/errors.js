export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Pedido não encontrado') {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Operação incompatível com o estado atual do pedido (ex.: cancelar em preparo). */
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConflictError';
  }
}
