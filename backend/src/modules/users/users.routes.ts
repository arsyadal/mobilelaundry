import { Router } from 'express';
import { getCustomers, getCustomerDetail } from './users.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', getCustomers);
router.get('/:id', getCustomerDetail);

export default router;
