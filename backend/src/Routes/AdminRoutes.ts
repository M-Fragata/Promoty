import { Router, type Request, type Response, type NextFunction } from 'express';
import { authMiddleware } from '../Middleware/authMiddleware.js';
import { AdminController } from '../Controller/AdminController.js';

const adminRoutes = Router();
const adminController = new AdminController();

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    const userEmail = req.user?.email?.toLowerCase();

    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
        return res.status(403).json({ error: 'Acesso negado. Você não é administrador.' });
    }

    next();
}

adminRoutes.get('/products', authMiddleware, adminMiddleware, adminController.getProducts);
adminRoutes.delete('/products/:id', authMiddleware, adminMiddleware, adminController.deleteProduct);
adminRoutes.put('/products/:id/category', authMiddleware, adminMiddleware, adminController.updateCategory);

export { adminRoutes };
