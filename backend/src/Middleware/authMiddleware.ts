import { type Request, type Response, type NextFunction } from 'express';
import { authService, type TokenPayload } from '../Services/AuthService.js';

// Extender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extrair token do header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }

    // Formato: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const token = parts[1];

    // Verificar e decodificar o token
    const payload = authService.verifyToken(token);

    // Adicionar dados do usuário ao request
    req.user = payload;

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido' });
      }
    }

    return res.status(401).json({ error: 'Erro de autenticação' });
  }
};
