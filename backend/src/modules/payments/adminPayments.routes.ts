import { Router } from 'express';
import { confirmPayment, rejectPayment } from './adminPayments.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.put('/:id/confirm', confirmPayment);
router.put('/:id/reject', rejectPayment);

export default router;
