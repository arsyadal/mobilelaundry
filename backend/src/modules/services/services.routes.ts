import { Router } from 'express';
import { listServices, createService, updateService, toggleService } from './services.controller';
import { authenticate, requireAdmin } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { serviceSchema } from './services.schema';

const router = Router();

// Public - list active services
router.get('/', listServices);

// Admin only
router.post('/', authenticate, requireAdmin, validate(serviceSchema), createService);
router.put('/:id', authenticate, requireAdmin, validate(serviceSchema), updateService);
router.patch('/:id/toggle', authenticate, requireAdmin, toggleService);

export default router;
