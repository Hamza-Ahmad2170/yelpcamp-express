import z from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.url().min(1, 'DATABASE_URL is required'),
  ACCESS_TOKEN_SECRET: z.string().min(1, 'ACCESS_TOKEN_SECRET is required'),
  REFRESH_TOKEN_SECRET: z.string().min(1, 'REFRESH_TOKEN_SECRET is required'),
  NODE_ENV: z.enum(['development', 'production']),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;

export const isDevelopment = env.NODE_ENV === 'development';
