import { Router } from 'express';
import { getAllOrders, getOrderDetail, updateOrderStatus, updateActualWeight } from './adminOrders.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updateStatusSchema, updateWeightSchema } from './orders.schema';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/', getAllOrders);
router.get('/:id', getOrderDetail);
router.put('/:id/status', validate(updateStatusSchema), updateOrderStatus);
router.put('/:id/weight', validate(updateWeightSchema), updateActualWeight);

export default router;
