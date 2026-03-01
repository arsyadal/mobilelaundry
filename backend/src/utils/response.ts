import { Response } from 'express';

interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown>
): Response {
  const response: ApiResponse<T> = { success: true, message, data };
  if (meta) response.meta = meta;
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  error?: string
): Response {
  const response: ApiResponse = { success: false, message };
  if (error) response.error = error;
  return res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T, message = 'Created successfully'): Response {
  return sendSuccess(res, data, message, 201);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized'): Response {
  return sendError(res, message, 401);
}

export function sendForbidden(res: Response, message = 'Forbidden'): Response {
  return sendError(res, message, 403);
}

export function sendNotFound(res: Response, message = 'Not found'): Response {
  return sendError(res, message, 404);
}

export function sendServerError(res: Response, message = 'Internal server error'): Response {
  return sendError(res, message, 500);
}
