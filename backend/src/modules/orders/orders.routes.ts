import { Router } from 'express';
import { createOrder, getMyOrders, getMyOrderDetail } from './orders.controller';
import { authenticate, requireCustomer } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createOrderSchema } from './orders.schema';

const router = Router();

router.use(authenticate);

router.post('/', requireCustomer, validate(createOrderSchema), createOrder);
router.get('/my', getMyOrders);
router.get('/my/:id', getMyOrderDetail);

export default router;
