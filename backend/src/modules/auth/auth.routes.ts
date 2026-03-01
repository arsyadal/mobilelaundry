import { Router } from 'express';
import { register, login, getMe, updateMe, saveExpoToken } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { registerSchema, loginSchema, updateMeSchema } from './auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validate(updateMeSchema), updateMe);
router.post('/expo-token', authenticate, saveExpoToken);

export default router;
