import { Router } from 'express';
import { CeAController } from '../Controller/AwinController/C&AController';

export const CeARoutes = Router();
const awinController = new CeAController();

CeARoutes.get('/cea', (req, res) => awinController.iniciarSincronizacao(req, res));

