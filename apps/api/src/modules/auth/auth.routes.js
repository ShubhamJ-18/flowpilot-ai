import { Router } from 'express';
import { z } from 'zod';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validator.js';
import { requireAuth } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/security.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Valid email address required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});

const loginSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(1, 'Password required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email address required'),
});

router.post('/register', authLimiter, validateRequest({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validateRequest({ body: loginSchema }), authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);
router.post('/forgot-password', authLimiter, validateRequest({ body: forgotPasswordSchema }), authController.forgotPassword);

export default router;
