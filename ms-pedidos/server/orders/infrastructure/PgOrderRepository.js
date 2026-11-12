import { randomUUID } from 'node:crypto';
import { Pedido } from '../domain/Pedido.js';
import { getPool } from './pg-client.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const num = (v) => (v === null || v === undefined ? v : Number(v));

function toEntity(row, itens, historico) {
  return new Pedido({
    id: row.id,
    clienteId: row.cliente_id,
    restauranteId: row.restaurante_id,
    status: row.status,
    subtotal: num(row.subtotal),
    taxaEntrega: num(row.taxa_entrega),
    desconto: num(row.desconto),
    valorTotal: num(row.valor_total),
    enderecoEntrega: row.endereco_entrega,
    idempotencyKey: row.idempotency_key,
    transacaoId: row.transacao_id,
    criadoEm: new Date(row.criado_em).toISOString(),
    atualizadoEm: new Date(row.atualizado_em).toISOString(),
    itens: itens.map((i) => ({
      itemCardapioId: i.item_cardapio_id,
      nome: i.nome_snapshot,
      precoUnitario: num(i.preco_unitario),
      quantidade: i.quantidade,
    })),
    historico: historico.map((h) => ({ status: h.status, ocorridoEm: new Date(h.ocorrido_em).toISOString() })),
  });
}

async function inTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Adaptador de persistência (PostgreSQL / Neon) da porta OrderRepository. */
export class PgOrderRepository {
  constructor({ pool } = {}) {
    this.pool = pool ?? getPool();
  }

  async #load(rows) {
    if (rows.length === 0) return [];
    const ids = rows.map((r) => r.id);
    const [itens, historico] = await Promise.all([
      this.pool.query('SELECT * FROM itens_pedido WHERE pedido_id = ANY($1::uuid[])', [ids]),
      this.pool.query('SELECT * FROM historico_status WHERE pedido_id = ANY($1::uuid[]) ORDER BY ocorrido_em', [ids]),
    ]);
    return rows.map((r) =>
      toEntity(r, itens.rows.filter((i) => i.pedido_id === r.id), historico.rows.filter((h) => h.pedido_id === r.id)),
    );
  }

  async insert(pedido) {
    const id = randomUUID();
    await inTransaction(this.pool, async (client) => {
      await client.query(
        `INSERT INTO pedidos (id, cliente_id, restaurante_id, status, subtotal, taxa_entrega, desconto, valor_total,
                              endereco_entrega, idempotency_key, criado_em, atualizado_em)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [id, pedido.clienteId, pedido.restauranteId, pedido.status, pedido.subtotal, pedido.taxaEntrega, pedido.desconto,
          pedido.valorTotal, JSON.stringify(pedido.enderecoEntrega), pedido.idempotencyKey, pedido.criadoEm, pedido.atualizadoEm],
      );
      for (const item of pedido.itens) {
        await client.query(
          'INSERT INTO itens_pedido (id, pedido_id, item_cardapio_id, nome_snapshot, preco_unitario, quantidade) VALUES ($1, $2, $3, $4, $5, $6)',
          [randomUUID(), id, item.itemCardapioId, item.nome, item.precoUnitario, item.quantidade],
        );
      }
      for (const h of pedido.historico) {
        await client.query('INSERT INTO historico_status (id, pedido_id, status, ocorrido_em) VALUES ($1, $2, $3, $4)', [
          randomUUID(), id, h.status, h.ocorridoEm,
        ]);
      }
    });
    return new Pedido({ ...pedido, id });
  }

  async findById(id) {
    if (!UUID.test(id ?? '')) return null;
    const { rows } = await this.pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
    return (await this.#load(rows))[0] ?? null;
  }

  async findByIdempotencyKey(key) {
    const { rows } = await this.pool.query('SELECT * FROM pedidos WHERE idempotency_key = $1', [key]);
    return (await this.#load(rows))[0] ?? null;
  }

  async list({ status, restauranteId, clienteId } = {}) {
    const filters = [
      ['status', status],
      ['restaurante_id', restauranteId],
      ['cliente_id', clienteId],
    ].filter(([, value]) => value);
    const where = filters.map(([column], i) => column + ' = $' + (i + 1));
    const sql = 'SELECT * FROM pedidos ' + (where.length ? 'WHERE ' + where.join(' AND ') + ' ' : '') + 'ORDER BY criado_em DESC LIMIT 200';
    const { rows } = await this.pool.query(sql, filters.map(([, value]) => value));
    return this.#load(rows);
  }

  async saveStatus(pedido) {
    const ultimo = pedido.historico.at(-1);
    await inTransaction(this.pool, async (client) => {
      await client.query('UPDATE pedidos SET status = $2, transacao_id = $3, atualizado_em = $4 WHERE id = $1', [
        pedido.id, pedido.status, pedido.transacaoId, pedido.atualizadoEm,
      ]);
      await client.query('INSERT INTO historico_status (id, pedido_id, status, ocorrido_em) VALUES ($1, $2, $3, $4)', [
        randomUUID(), pedido.id, ultimo.status, ultimo.ocorridoEm,
      ]);
    });
    return pedido;
  }
}
