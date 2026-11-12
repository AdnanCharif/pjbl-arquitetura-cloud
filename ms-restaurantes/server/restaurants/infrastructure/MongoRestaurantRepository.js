import { ObjectId } from 'mongodb';
import { Restaurant } from '../domain/Restaurant.js';
import { getDb } from './mongo-client.js';

const COLLECTION = 'restaurants';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isValidId = (id) => ObjectId.isValid(id);

function toEntity(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return new Restaurant({ id: _id.toString(), ...rest });
}

function toDocument(restaurant) {
  const { id, ...rest } = restaurant;
  return rest;
}

/** Adaptador de persistência (MongoDB Atlas) - Database per Service. */
export class MongoRestaurantRepository {
  async #collection() {
    return (await getDb()).collection(COLLECTION);
  }

  async search({ q, category } = {}) {
    const filter = {};
    if (q) filter.name = { $regex: escapeRegex(q), $options: 'i' };
    if (category) filter.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
    const docs = await (await this.#collection()).find(filter).toArray();
    return docs.map(toEntity);
  }

  async findById(id) {
    if (!isValidId(id)) return null;
    return toEntity(await (await this.#collection()).findOne({ _id: new ObjectId(id) }));
  }

  async insert(restaurant) {
    const result = await (await this.#collection()).insertOne(toDocument(restaurant));
    return new Restaurant({ ...restaurant, id: result.insertedId.toString() });
  }

  async update(id, restaurant) {
    if (!isValidId(id)) return null;
    const result = await (await this.#collection()).findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: toDocument(restaurant) },
      { returnDocument: 'after' },
    );
    return toEntity(result);
  }

  async remove(id) {
    if (!isValidId(id)) return false;
    const result = await (await this.#collection()).deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount === 1;
  }
}
