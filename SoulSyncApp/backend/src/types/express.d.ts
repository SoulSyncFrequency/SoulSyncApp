import 'express';
declare global {
  namespace Express {
    interface Request {
      reqId?: string;
      user?: { id: string; role?: 'ADMIN' | 'USER' } | null;
    }
  }
}
