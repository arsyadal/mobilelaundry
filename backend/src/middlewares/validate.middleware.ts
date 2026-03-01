import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      sendError(res, `Validation failed: ${errors}`, 422);
      return;
    }
    req.body = result.data;
    next();
  };
}
