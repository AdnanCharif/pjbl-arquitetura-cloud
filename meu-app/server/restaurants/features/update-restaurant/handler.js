import { sendJson, handleError } from '../../../shared/http.js';

export function updateRestaurantHandler({ updateRestaurant }) {
  return async (req, res) => {
    try {
      sendJson(res, 200, await updateRestaurant.execute(req.query.id, req.body));
    } catch (err) {
      handleError(res, err);
    }
  };
}
