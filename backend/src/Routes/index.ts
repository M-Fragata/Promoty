import { Router } from 'express';

import { offersRoutes } from './OffersRoutes.js';
import { dealsRoutes } from './DealsRoutes.js';

export const routes = Router();

routes.use('/api', dealsRoutes);
routes.use('/ofertas', offersRoutes);
