import { MongoClient } from 'mongodb';

// Reaproveita a conexão entre invocações "quentes" da função serverless.
export function getDb() {
  if (!globalThis.__mongoClientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('Variável de ambiente MONGODB_URI não configurada.');
    globalThis.__mongoClientPromise = new MongoClient(uri).connect();
  }
  return globalThis.__mongoClientPromise.then((client) =>
    client.db(process.env.MONGODB_DB || 'prato'),
  );
}
