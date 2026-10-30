import type { Request } from 'express';
declare global {
  namespace Express {
    interface Request {
      validatedBody?: unknown;
      validatedData?: unknown;
      auth?: { userId: string; role: number; accessTokenId: string; expiresAt: number };
    }
  }
}
export interface IRequest<TBody = unknown> extends Request { body: TBody; }
