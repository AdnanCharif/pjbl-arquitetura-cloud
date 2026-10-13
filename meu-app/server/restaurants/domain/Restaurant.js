import { ValidationError } from './errors.js';

/**
 * Entidade Restaurante (documento único, cardápio embutido em `menu`).
 * Regras de negócio puras: não conhece HTTP nem MongoDB.
 */
export class Restaurant {
  constructor({ id = null, name, category, deliveryTime, rating, image = '', menu }) {
    this.id = id;
    this.name = name;
    this.category = category;
    this.deliveryTime = deliveryTime;
    this.rating = rating;
    this.image = image;
    this.menu = menu;
  }

  static create(input = {}, id = null) {
    const { name, category, deliveryTime, rating, image = '', menu = [] } = input ?? {};

    if (typeof name !== 'string' || name.trim() === '') {
      throw new ValidationError('O campo "name" é obrigatório.');
    }
    if (typeof category !== 'string' || category.trim() === '') {
      throw new ValidationError('O campo "category" é obrigatório.');
    }
    if (typeof deliveryTime !== 'string' || deliveryTime.trim() === '') {
      throw new ValidationError('O campo "deliveryTime" é obrigatório (ex.: "30-40 min").');
    }
    if (typeof rating !== 'number' || rating < 0 || rating > 5) {
      throw new ValidationError('O campo "rating" deve ser um número entre 0 e 5.');
    }
    if (typeof image !== 'string' || (image !== '' && !/^(https?:\/\/|\/)/.test(image))) {
      throw new ValidationError('O campo "image" deve ser uma URL (http/https) ou um caminho iniciado por "/".');
    }
    if (!Array.isArray(menu)) {
      throw new ValidationError('O campo "menu" deve ser uma lista de itens.');
    }
    menu.forEach((item, i) => {
      if (!item || typeof item.name !== 'string' || item.name.trim() === '') {
        throw new ValidationError(`Item ${i + 1} do menu: "name" é obrigatório.`);
      }
      if (typeof item.price !== 'number' || item.price < 0) {
        throw new ValidationError(`Item ${i + 1} do menu: "price" deve ser um número >= 0.`);
      }
    });

    return new Restaurant({
      id,
      name: name.trim(),
      category: category.trim(),
      deliveryTime: deliveryTime.trim(),
      rating,
      image,
      menu: menu.map((m, i) => ({
        id: m.id ?? i + 1,
        name: m.name.trim(),
        description: typeof m.description === 'string' ? m.description : '',
        price: m.price,
      })),
    });
  }
}
