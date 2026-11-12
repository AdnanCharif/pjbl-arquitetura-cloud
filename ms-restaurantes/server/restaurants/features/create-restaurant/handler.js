import { sendJson, handleError } from '../../../shared/http.js';

export function createRestaurantHandler({ createRestaurant }) {
  return async (req, res) => {
    try {
      sendJson(res, 201, await createRestaurant.execute(req.body));
    } catch (err) {
      handleError(res, err);
    }
  };
}
