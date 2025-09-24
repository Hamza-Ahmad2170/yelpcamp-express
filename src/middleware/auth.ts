import type { Request, Response, NextFunction } from 'express';
import ApiError from '@/lib/ApiError.js';
import { env } from '@/lib/env.js';
import { verifyToken } from '@/lib/utils.js';
import type { AccessTokenPayload } from '@/types/payload.js';

const auth = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return next(new ApiError(401, 'Unauthorized request'));

  const [, token] = authHeader.split(' ');
  if (!token) return next(new ApiError(401, 'invalid token'));

  const decodedUser = verifyToken<AccessTokenPayload>(token, env.ACCESS_TOKEN_SECRET);

  if (!decodedUser) return next(new ApiError(401, 'invalid token'));

  req.userId = decodedUser.sub;

  return next();
};

export default auth;
