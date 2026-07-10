import { Router } from 'express';
import { DealsController } from '../Controller/DealsController.js';

export const dealsRoutes = Router();
const dealsController = new DealsController();

dealsRoutes.get('/deals', dealsController.getDeals);
dealsRoutes.get('/search', dealsController.search);
dealsRoutes.get('/live-search', dealsController.liveSearch);
