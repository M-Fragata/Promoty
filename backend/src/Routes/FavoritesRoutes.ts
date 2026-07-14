import { Router } from 'express';
import { favoritesController } from '../Controller/FavoritesController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';

const favoritesRoutes = Router();

// Todas as rotas de favoritos requerem autenticação
favoritesRoutes.use(authMiddleware);

// Rotas de favoritos
favoritesRoutes.get('/', favoritesController.getFavorites);
favoritesRoutes.post('/:productId', favoritesController.addFavorite);
favoritesRoutes.delete('/:productId', favoritesController.removeFavorite);
favoritesRoutes.get('/check/:productId', favoritesController.checkFavorite);

export { favoritesRoutes };
