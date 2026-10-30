import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
type ValidationSource = 'body' | 'query' | 'params';
export const validation = (schema: ZodType, source: ValidationSource = 'body'): RequestHandler => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) { next(Object.assign(new Error(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')), { status: 400 })); return; }
  if (source === 'body') req.body = result.data;
  else req.validatedData = result.data;
  next();
};
