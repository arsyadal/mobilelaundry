import { Request, Response, NextFunction } from 'express';
import { sendServerError } from '../utils/response';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Unhandled error:', err);

  if (err.message === 'Only JPEG, PNG, and WebP images are allowed') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  if ((err as NodeJS.ErrnoException).code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ success: false, message: 'File size exceeds limit (5MB max)' });
    return;
  }

  sendServerError(res, err.message || 'Internal server error');
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: 'Route not found' });
}
