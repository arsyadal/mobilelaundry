import { Router } from 'express';
import { getDashboard } from './dashboard.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, requireAdmin, getDashboard);

export default router;
