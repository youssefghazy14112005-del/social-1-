import express from 'express';
import authenticationController from './modules/authentication/authentication.controller.js';
import userController from './modules/user/user.controller.js';
import { globalErrorHandling } from './middleware/error.middleware.js';
import { ORIGINS } from './config.js';
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (ORIGINS.length === 0 || ORIGINS.includes(origin))) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Credentials', 'true'); }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') { res.sendStatus(204); return; }
  next();
});
app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok', environment: process.env.NODE_ENV ?? 'development' } }));
app.use('/api/v1/auth', authenticationController);
app.use('/api/v1/users', userController);
app.use((_req, _res, next) => next(Object.assign(new Error('Route not found'), { status: 404 })));
app.use(globalErrorHandling);
export default app;
