import z, { type ZodType } from 'zod';
import { type Request } from 'express';
import { UAParser } from 'ua-parser-js';
import ApiError from './ApiError.js';
import jwt from 'jsonwebtoken';
import type { AccessTokenPayload, RefreshTokenPayload } from '../types/payload.js';

const validate = <T>(schema: ZodType<T>, data: unknown) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    console.log(result.error);

    throw new ApiError(400, 'Validation failed', z.flattenError(result.error).fieldErrors);
  }
  return result.data;
};

const verifyToken = <T extends AccessTokenPayload | RefreshTokenPayload>(
  token: string,
  secret: string,
): T | null => {
  try {
    const payload = jwt.verify(token, secret) as T;
    return payload;
  } catch (error) {
    return null;
  }
};

const userAgent = (req: Request) => {
  const parser = UAParser(req.headers['user-agent']);
  return {
    browser: parser.browser.name ?? 'unknown',
    os: parser.os.name ?? 'unknown',
  };
};

export { verifyToken, validate, userAgent };
