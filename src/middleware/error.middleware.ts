import type { ErrorRequestHandler } from 'express';
import type { IError } from '../common/interface/error.interface.js';
export const globalErrorHandling: ErrorRequestHandler = (error: IError, _req, res, _next) => {
  const status = error.status ?? (error.code === 11000 ? 409 : error.name === 'CastError' ? 400 : 500);
  const message = error.code === 11000 ? 'A record with this value already exists' : error.message || 'server error';
  res.status(status).json({ error_message: message, error: error.name, cause: error.cause, ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}) });
};
