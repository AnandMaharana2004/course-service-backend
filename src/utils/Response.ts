import { Response } from 'express';

/**
 * Simple Response Handler
 * Just two methods: success() and error()
 */

// Success Response
export const sendSuccess = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200,
) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    statusCode,
  });
};

// Error Response
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
) => {
  res.status(statusCode).json({
    success: false,
    message,
    // Only show stack in development
    ...(process.env.NODE_ENV === 'development' && { stack: new Error().stack }),
  });
};

// That's it! Simple and clean.
