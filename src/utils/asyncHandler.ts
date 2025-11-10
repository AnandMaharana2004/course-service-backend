import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import {
  InternalServerError,
  ServiceUnavailableError,
  BadRequestError,
  ConflictError,
} from '../utils/Error';

type AsyncHandlerFn = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const asyncHandler = (fn: AsyncHandlerFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      // If it's already our custom AppError, just pass it along
      if (error.statusCode && error.isOperational !== undefined) {
        return next(error);
      }

      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return next(handlePrismaError(error));
      }

      if (error instanceof Prisma.PrismaClientValidationError) {
        return next(new BadRequestError('Invalid data provided'));
      }

      if (error instanceof Prisma.PrismaClientInitializationError) {
        // Database connection failed
        return next(new ServiceUnavailableError('Database connection failed'));
      }

      if (error instanceof Prisma.PrismaClientRustPanicError) {
        return next(new InternalServerError('Database engine error'));
      }

      // Handle generic database/connection errors
      if (error.message?.includes('Environment variable not found')) {
        return next(
          new ServiceUnavailableError('Database configuration error'),
        );
      }

      if (error.message?.includes("Can't reach database server")) {
        return next(new ServiceUnavailableError('Database server unreachable'));
      }

      // Handle validation errors from Zod or other libraries
      if (error.name === 'ZodError') {
        return next(new BadRequestError(formatZodError(error)));
      }

      // Unknown error - treat as internal server error
      return next(
        new InternalServerError(
          process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : error.message,
        ),
      );
    });
  };
};

// Helper function to handle Prisma errors
function handlePrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.[0] || 'field';
      return new ConflictError(`${field} already exists`);

    case 'P2025':
      // Record not found
      return new BadRequestError('Record not found');

    case 'P2003':
      // Foreign key constraint violation
      return new BadRequestError('Invalid reference');

    case 'P2011':
      // Null constraint violation
      return new BadRequestError('Required field is missing');

    case 'P2014':
      // Relation violation
      return new BadRequestError('Invalid relation');

    case 'P1001':
    case 'P1002':
    case 'P1008':
    case 'P1017':
      // Connection/timeout errors
      return new ServiceUnavailableError('Database connection error');

    default:
      // Unknown Prisma error
      return new InternalServerError(
        process.env.NODE_ENV === 'production'
          ? 'Database operation failed'
          : `Database error: ${error.message}`,
      );
  }
}

// Helper function to format Zod errors
function formatZodError(error: any): string {
  if (error.errors && Array.isArray(error.errors)) {
    return error.errors
      .map((err: any) => `${err.path.join('.')}: ${err.message}`)
      .join(', ');
  }
  return 'Validation failed';
}
