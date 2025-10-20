import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const statusCode =
    typeof err === 'object' && err !== null && 'statusCode' in err
      ? (err as any).statusCode
      : 500;

  // Get error message
  const message =
    typeof err === 'object' && err !== null && 'message' in err
      ? (err as any).message
      : 'Something went wrong';

  //log error logic
  console.error(`${req.method} ${req.url} - ${message}`, {
    stack:
      typeof err === 'object' && err !== null && 'stack' in err
        ? (err as any).stack
        : undefined,
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack trace in development
    ...(process.env.NODE_ENV === 'development' &&
      typeof err === 'object' &&
      err !== null &&
      'stack' in err && { stack: (err as any).stack }),
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
