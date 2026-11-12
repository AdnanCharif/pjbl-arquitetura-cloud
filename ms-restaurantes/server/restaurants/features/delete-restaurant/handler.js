import { sendJson, handleError, routeId } from '../../../shared/http.js';

export function deleteRestaurantHandler({ deleteRestaurant }) {
  return async (req, res) => {
    try {
      await deleteRestaurant.execute(routeId(req));
      sendJson(res, 200, { message: 'Restaurante excluído com sucesso.' });
    } catch (err) {
      handleError(res, err);
    }
  };
}
