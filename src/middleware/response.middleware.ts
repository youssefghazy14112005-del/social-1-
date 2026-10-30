import type { Request, Response, NextFunction, RequestHandler } from 'express';
export function successResponse<T>({ res, message = 'Done', data, status = 200 }: { res: Response; message?: string | boolean; data?: T; status?: number }): void {
  res.status(status).json({ message, status, ...(data === undefined ? {} : { data }) });
}
export function responseFormatter<T>(handler: (req: Request, res: Response, next: NextFunction) => Promise<T>, status = 200, message: string | boolean = 'Done'): RequestHandler {
  return async (req, res, next) => { try { const data = await handler(req, res, next); if (!res.headersSent) successResponse({ res, message, data, status }); } catch (error) { next(error); } };
}
