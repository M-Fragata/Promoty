import { type Request, type Response } from 'express';
import { z } from 'zod';
import { authService } from '../Services/AuthService.js';

// Schemas de validação
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres')
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória')
});

export class AuthController {

  register = async (req: Request, res: Response) => {
    try {
      // Validar dados com Zod
      const validation = registerSchema.safeParse(req.body);

      if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: errors
        });
      }

      const result = await authService.register(validation.data);

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      // Validar dados com Zod
      const validation = loginSchema.safeParse(req.body);

      if (!validation.success) {
        const errors = validation.error.flatten().fieldErrors;
        return res.status(400).json({ 
          error: 'Dados inválidos',
          details: errors
        });
      }

      const result = await authService.login(validation.data);

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };

  getMe = async (req: Request, res: Response) => {
    try {
      // req.user é definido pelo authMiddleware
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado' });
      }

      const user = await authService.getMe(req.user.sub);

      return res.status(200).json({ user });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
}

export const authController = new AuthController();
