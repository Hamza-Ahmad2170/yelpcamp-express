// middleware/errorController.ts
import type { NextFunction, Request, Response } from 'express';
import ApiError from '@/lib/ApiError.js';
import { isDevelopment } from '@/lib/env.js';
import { Error as MongooseError } from 'mongoose';

// --- Dev environment errors ---
const devErrors = (res: Response, error: ApiError) => {
  console.error(error); // log full error
  res.status(error.statusCode).json({
    status: error.status,
    statusCode: error.statusCode,
    message: error.message,
    details: error.details,
    stack: error.stack,
    name: error.name,
  });
};

// --- Prod environment errors ---
const prodErrors = (res: Response, error: ApiError) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      statusCode: error.statusCode,
      message: error.message,
      ...(error.details ? { details: error.details } : {}),
    });
  } else {
    console.error('UNEXPECTED ERROR 💥', error);
    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Something went wrong! Please try again later.',
    });
  }
};

// --- Mongoose error mappers ---
const validationErrorHandler = (err: MongooseError.ValidationError) => {
  const errors = Object.entries(err.errors).map(([field, val]: [string, any]) => ({
    field,
    message: val.message,
  }));
  return new ApiError(400, 'Invalid input data', { errors });
};

const castErrorHandler = (err: MongooseError.CastError) => {
  const msg = `Invalid value for ${err.path}: ${err.value}`;
  return new ApiError(400, msg, { field: err.path, value: err.value });
};

const duplicateKeyErrorHandler = (err: any) => {
  const field = Object.keys(err.keyPattern ?? {})[0];
  const value = field ? err.keyValue?.[field] : undefined;
  const msg = field
    ? `Duplicate value for "${field}": "${value}". Please use another value!`
    : 'Duplicate key error. Please use another value!';
  return new ApiError(400, msg, { field, value });
};

const mongooseErrorHandler = (err: MongooseError) => {
  if (err instanceof MongooseError.ValidationError) return validationErrorHandler(err);
  if (err instanceof MongooseError.CastError) return castErrorHandler(err);
  if ((err as any).code === 11000) return duplicateKeyErrorHandler(err);
  return new ApiError(500, 'Mongoose error', { name: err.name });
};

// --- Global handler ---
const globalErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else if (err instanceof MongooseError) {
    error = mongooseErrorHandler(err);
  } else {
    const original = err as Error;
    error = new ApiError(
      500,
      original?.message || 'Something went wrong',
      undefined,
      original?.stack,
      false,
    );
    error.name = original?.name || 'Error';
  }

  if (isDevelopment) {
    return devErrors(res, error);
  }

  return prodErrors(res, error);
};

export default globalErrorHandler;
