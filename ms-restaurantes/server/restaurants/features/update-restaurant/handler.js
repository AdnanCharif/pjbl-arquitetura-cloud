import { sendJson, handleError, routeId } from '../../../shared/http.js';

export function updateRestaurantHandler({ updateRestaurant }) {
  return async (req, res) => {
    try {
      sendJson(res, 200, await updateRestaurant.execute(routeId(req), req.body));
    } catch (err) {
      handleError(res, err);
    }
  };
}
