import express, { type Request } from 'express';
import cors from 'cors';

import cookieParser from 'cookie-parser';
import { isDevelopment } from '@/lib/env.js';
import ApiError from '@/lib/ApiError.js';
import globalErrorHandler from '@/controllers/error.controller.js';
import campgroundRouter from '@/routes/campground.routes.js';
import authRouter from '@/routes/auth.routes.js';

const app: express.Application = express();

if (isDevelopment) {
  const morgan = await import('morgan');
  app.use(morgan.default('dev'));
}

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1/campgrounds', campgroundRouter);
app.use('/api/v1/auth', authRouter);

app.all('/*splat', (req: Request) => {
  throw new ApiError(404, `Can't find ${req.originalUrl} on this server!`);
});

app.use(globalErrorHandler);

export { app };
