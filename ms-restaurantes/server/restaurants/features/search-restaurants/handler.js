import { sendJson, handleError } from '../../../shared/http.js';

export function searchRestaurantsHandler({ searchRestaurants }) {
  return async (req, res) => {
    try {
      const { q, category } = req.query ?? {};
      sendJson(res, 200, await searchRestaurants.execute({ q, category }));
    } catch (err) {
      handleError(res, err);
    }
  };
}
