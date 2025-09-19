import type { NextFunction, Response, Request } from 'express';
import ApiError from '../lib/ApiError.js';
import { isDevelopment } from '../lib/env.js';
import { Error as MongooseError } from 'mongoose';

const devErrors = (res: Response, error: any) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    stack: error.stack,
    error: {
      name: error.name,
      ...(error.data ? { ...error.data } : {}),
    },
  });
};

const mongooseErrorHandler = (err: MongooseError) => {
  if (err instanceof MongooseError.ValidationError) return validationErrorHandler(err);
  if (err instanceof MongooseError.CastError) return castErrorHandler(err);
  if ((err as any).code === 11000) return duplicateKeyErrorHandler(err);

  return new ApiError(500, 'Something went wrong', undefined, (err as Error)?.stack, false);
};

const validationErrorHandler = (err: MongooseError.ValidationError) => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const msg = `Invalid input data. ${errors.join('. ')}`;
  return new ApiError(400, msg, { errors });
};

const castErrorHandler = (err: MongooseError.CastError) => {
  const msg = `Invalid value for ${err.path}: ${err.value}!`;
  return new ApiError(400, msg);
};

const duplicateKeyErrorHandler = (err: any) => {
  const keyValue = (err.keyValue ?? {}) as Record<string, unknown>;
  const [field] = Object.keys(keyValue);

  const msg = field
    ? `Duplicate value for field "${field}": "${keyValue?.[field]}". Please use another value!`
    : 'Duplicate key error. Please use another value!';

  return new ApiError(400, msg);
};
const prodErrors = (res: Response, error: ApiError) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      ...(error.data ? { ...error.data } : {}),
    });
  } else {
    console.error('UNEXPECTED ERROR 💥', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  }
};

const globalErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof MongooseError) {
    error = mongooseErrorHandler(err);
  } else {
    error = new ApiError(
      500,
      (err as Error)?.message || 'Something went wrong',
      undefined,
      (err as Error)?.stack,
      false,
    );
  }

  if (isDevelopment) {
    return devErrors(res, error);
  }

  return prodErrors(res, error);
};

export default globalErrorHandler;
