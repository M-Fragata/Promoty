import { Router } from 'express';

import { offersRoutes } from './OffersRoutes.js';
import { dealsRoutes } from './DealsRoutes.js';
import { authRoutes } from './AuthRoutes.js';
import { favoritesRoutes } from './FavoritesRoutes.js';
import { createdLinksRoutes } from './CreatedLinksRoutes.js';
import { createdLinksController } from '../Controller/CreatedLinksController.js';

export const routes = Router();

routes.use('/api/auth', authRoutes);
routes.use('/api/favorites', favoritesRoutes);
routes.use('/api/links', createdLinksRoutes);
routes.use('/api', dealsRoutes);
routes.use('/ofertas', offersRoutes);

// Rota pública de redirecionamento (sem auth)
routes.get('/r/:id', createdLinksController.redirect);
