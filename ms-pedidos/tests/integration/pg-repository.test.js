/**
 * Teste de integração do PgOrderRepository contra um PostgreSQL real.
 * Só roda quando TEST_DATABASE_URL está definido, por exemplo:
 *   TEST_DATABASE_URL=postgres://postgres@localhost:5432/pedidos npm test
 */
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { entrada } from '../fixtures.js';

const url = process.env.TEST_DATABASE_URL;

test('PgOrderRepository: insert, find, list, saveStatus e idempotência', { skip: !url && 'TEST_DATABASE_URL não definido' }, async () => {
  process.env.DATABASE_URL = url;
  const { ensureSchema, getPool } = await import('../../server/orders/infrastructure/pg-client.js');
  const { PgOrderRepository } = await import('../../server/orders/infrastructure/PgOrderRepository.js');
  const { Pedido, Status } = await import('../../server/orders/domain/Pedido.js');
  after(() => getPool().end());

  await ensureSchema();
  const repo = new PgOrderRepository();
  const key = `it-${Date.now()}`;
  const saved = await repo.insert(Pedido.create(entrada({ idempotencyKey: key })));
  assert.match(saved.id, /^[0-9a-f-]{36}$/);

  const found = await repo.findById(saved.id);
  assert.equal(found.valorTotal, 147.2);
  assert.equal(found.itens.length, 2);
  assert.deepEqual(found.enderecoEntrega, entrada().enderecoEntrega);

  found.transacaoId = 'sim-1';
  found.mudarStatus(Status.CONFIRMADO);
  await repo.saveStatus(found);
  const again = await repo.findById(saved.id);
  assert.equal(again.status, 'CONFIRMADO');
  assert.equal(again.transacaoId, 'sim-1');
  assert.deepEqual(again.historico.map((h) => h.status), ['PENDENTE', 'CONFIRMADO']);

  assert.equal((await repo.findByIdempotencyKey(key)).id, saved.id);
  assert.ok((await repo.list({ status: 'CONFIRMADO' })).some((p) => p.id === saved.id));
  assert.equal(await repo.findById('nao-e-uuid'), null);
});
