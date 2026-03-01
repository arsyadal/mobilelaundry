import { Router } from 'express';
import { uploadPaymentProof } from './payments.controller';
import { authenticate, requireCustomer } from '../../middlewares/auth.middleware';
import { uploadPaymentProof as uploadMiddleware } from '../../middlewares/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/:orderId/proof', requireCustomer, (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    next();
  });
}, uploadPaymentProof);

export default router;
