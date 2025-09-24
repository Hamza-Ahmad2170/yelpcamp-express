import argon2, { type Options } from 'argon2';
import { isDevelopment } from './env.js';
import { type CookieOptions } from 'express';

const argonOptions: Options = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: !isDevelopment,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export { argonOptions, cookieOptions };
