import { Router } from 'express';

import { offersRoutes } from './OffersRoutes.js';

export const routes = Router();

routes.use('/ofertas', offersRoutes);