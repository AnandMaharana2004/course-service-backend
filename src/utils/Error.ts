class AppError extends Error {
  statusCode: number;
  isOperational: boolean; // ✅ Add this

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor); // ✅ Better stack traces
  }
}

// 400 - Bad Request (Operational)
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400, true); // ✅ Operational = don't log stack
  }
}

// 401 - Unauthorized (Operational)
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, true);
  }
}

// 403 - Forbidden (Operational)
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, true);
  }
}

// 404 - Not Found (Operational)
export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404, true);
  }
}

// 409 - Conflict (Operational)
export class ConflictError extends AppError {
  constructor(message: string = 'Already Exists') {
    super(message, 409, true);
  }
}

// 422 - Validation Error (Operational)
export class ValidationError extends AppError {
  constructor(message: string = 'Validation Failed') {
    super(message, 422, true);
  }
}

// 500 - Internal Server Error (NOT Operational - should be logged!)
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error') {
    super(message, 500, false); // ✅ NOT operational = log with stack
  }
}

// 503 - Service Unavailable (NOT Operational)
export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable') {
    super(message, 503, false);
  }
}

export default AppError;
