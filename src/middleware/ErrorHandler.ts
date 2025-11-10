import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/Error';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Default values for unknown errors
  let statusCode = 500;
  let message = 'Something went wrong';
  let isOperational = false;
  let stack: string | undefined;

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
    stack = err.stack;
  } else if (err instanceof Error) {
    // Native Error or other errors
    message = err.message;
    stack = err.stack;
  }

  // ✅ Only log non-operational errors (internal/unexpected errors)
  if (!isOperational) {
    console.error(`[INTERNAL ERROR] ${req.method} ${req.url}`, {
      message,
      statusCode,
      stack,
      body: req.body,
      params: req.params,
      query: req.query,
      user: (req as any).user?.id,
      timestamp: new Date().toISOString(),
    });
  } else {
    // Optional: Light logging for operational errors (for metrics/monitoring)
    console.info(
      `[CLIENT ERROR] ${req.method} ${req.url} - ${statusCode} - ${message}`,
    );
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    // ✅ Only show stack for non-operational errors in development
    ...(process.env.NODE_ENV === 'development' &&
      !isOperational &&
      stack && { stack }),
  });
};

// export const asyncHandler = (fn: Function) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     Promise.resolve(fn(req, res, next)).catch(next);
//   };
// };
