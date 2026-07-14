import { Router } from 'express';
import { createdLinksController } from '../Controller/CreatedLinksController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';

const createdLinksRoutes = Router();

// Todas as rotas de links criados requerem autenticação
createdLinksRoutes.use(authMiddleware);

// Rotas de links criados
createdLinksRoutes.post('/', createdLinksController.create);
createdLinksRoutes.get('/', createdLinksController.list);
createdLinksRoutes.delete('/:id', createdLinksController.delete);

export { createdLinksRoutes };
