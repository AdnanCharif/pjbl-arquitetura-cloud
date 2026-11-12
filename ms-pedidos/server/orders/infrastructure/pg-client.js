import pg from 'pg';

/**
 * Pool de conexões com o PostgreSQL (Neon). Database per Service: só o
 * Serviço de Pedidos acessa este banco. O esquema é criado na subida.
 */
let pool;

export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('Variável de ambiente DATABASE_URL não configurada.');
    const local = /@(localhost|127\.0\.0\.1|postgres)(:|\/)/.test(connectionString);
    pool = new pg.Pool({ connectionString, ssl: !local, max: 5 });
  }
  return pool;
}

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS pedidos (
  id               uuid PRIMARY KEY,
  cliente_id       text NOT NULL,
  restaurante_id   text NOT NULL,
  status           text NOT NULL,
  subtotal         numeric(10,2) NOT NULL,
  taxa_entrega     numeric(10,2) NOT NULL DEFAULT 0,
  desconto         numeric(10,2) NOT NULL DEFAULT 0,
  valor_total      numeric(10,2) NOT NULL,
  endereco_entrega jsonb NOT NULL,
  idempotency_key  text UNIQUE,
  transacao_id     text,
  criado_em        timestamptz NOT NULL DEFAULT now(),
  atualizado_em    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS itens_pedido (
  id               uuid PRIMARY KEY,
  pedido_id        uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  item_cardapio_id integer,
  nome_snapshot    text NOT NULL,
  preco_unitario   numeric(10,2) NOT NULL,
  quantidade       integer NOT NULL CHECK (quantidade > 0)
);
CREATE TABLE IF NOT EXISTS historico_status (
  id          uuid PRIMARY KEY,
  pedido_id   uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  status      text NOT NULL,
  ocorrido_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
`;

export async function ensureSchema() {
  await getPool().query(SCHEMA);
}
