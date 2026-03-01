import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { sendUnauthorized, sendForbidden } from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendUnauthorized(res, 'No token provided');
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }
    next();
  };
}

export const requireAdmin = requireRole('ADMIN');
export const requireCustomer = requireRole('PELANGGAN');
export const requireAny = requireRole('ADMIN', 'PELANGGAN');
