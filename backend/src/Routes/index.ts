import { Router } from 'express';

import { offersRoutes } from './OffersRoutes.js';
import { dealsRoutes } from './DealsRoutes.js';
import { authRoutes } from './AuthRoutes.js';
import { favoritesRoutes } from './FavoritesRoutes.js';

export const routes = Router();

routes.use('/api/auth', authRoutes);
routes.use('/api/favorites', favoritesRoutes);
routes.use('/api', dealsRoutes);
routes.use('/ofertas', offersRoutes);
