export interface IError extends Error { status?: number; cause?: unknown; code?: number; }
