import { Router } from 'express';
import { authController } from '../Controller/AuthController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';

const authRoutes = Router();

// Rotas públicas
authRoutes.post('/register', authController.register);
authRoutes.post('/login', authController.login);

// Rotas protegidas (requer autenticação)
authRoutes.get('/me', authMiddleware, authController.getMe);

export { authRoutes };
