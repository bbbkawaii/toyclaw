import { ZodError } from "zod";

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(message: string, code: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError("Invalid request payload", "VALIDATION_ERROR", 400, error.flatten());
  }

  if (error instanceof Error) {
    return new AppError(error.message, "INTERNAL_ERROR", 500);
  }

  return new AppError("Unexpected error", "INTERNAL_ERROR", 500);
}
