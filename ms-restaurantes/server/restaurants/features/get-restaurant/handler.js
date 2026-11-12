import { sendJson, handleError, routeId } from '../../../shared/http.js';

export function getRestaurantHandler({ getRestaurant }) {
  return async (req, res) => {
    try {
      sendJson(res, 200, await getRestaurant.execute(routeId(req)));
    } catch (err) {
      handleError(res, err);
    }
  };
}
