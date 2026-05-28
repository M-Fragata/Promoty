import { Router } from 'express';
import { PromosController } from '../Controller/PromosController.js';

export const offersRoutes = Router();
const promosController = new PromosController();

offersRoutes.post('/', promosController.getPromo);