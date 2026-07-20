import { Router } from 'express';
import { CeAController } from '../Controller/AwinController/C&AController';
import { DafitiController } from '../Controller/AwinController/DafitiController';
import { KabumController } from '../Controller/AwinController/KabumController';

export const CeARoutes = Router();
const awinController = new CeAController();
const dafitiController = new DafitiController();
const kabumController = new KabumController();

CeARoutes.get('/cea', (req, res) => awinController.iniciarSincronizacao(req, res));
CeARoutes.get('/dafiti', (req, res) => dafitiController.listar(req, res));
CeARoutes.get('/kabum', (req, res) => kabumController.listar(req, res));

