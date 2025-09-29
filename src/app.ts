import express, { type Request } from 'express';
import cors from 'cors';

import cookieParser from 'cookie-parser';
import { isDevelopment } from '@/lib/env.js';
import ApiError from '@/lib/ApiError.js';
import globalErrorHandler from '@/controllers/error.controller.js';
import campgroundRouter from '@/routes/campground.routes.js';
import authRouter from '@/routes/auth.routes.js';
import { UAParser } from 'ua-parser-js';

const app: express.Application = express();

if (isDevelopment) {
  const morgan = await import('morgan');
  app.use(morgan.default('dev'));
}

const allowedOrigins = ['http://localhost:5173', 'https://vw4k0mzx-5173.asse.devtunnels.ms'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true); // Origin is in the whitelist
      } else {
        // Don't throw an error, just reject the CORS request
        callback(null, false); // ✅ This is the fix
      }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

app.options('/*splat', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api/v1/campgrounds', campgroundRouter);
app.use('/api/v1/auth', authRouter);

app.get('/', (req, res) => {
  const parser = UAParser(req.headers['user-agent']);
  console.log({ parser });
  console.log(req.headers['sec-ch-ua-mobile']);

  res.send('Hello World!');
});

app.all('/*splat', (req: Request) => {
  throw new ApiError(404, `Can't find ${req.originalUrl} on this server!`);
});

app.use(globalErrorHandler);

export { app };
