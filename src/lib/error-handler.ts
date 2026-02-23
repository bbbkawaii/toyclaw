import type { FastifyInstance } from "fastify";
import { AppError, toAppError } from "./errors";

export function registerGlobalErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const mapped = mapFrameworkError(error);
    const appError = mapped ?? toAppError(error);

    request.log.error(
      {
        err: error,
        code: appError.code,
      },
      appError.message,
    );

    void reply.status(appError.statusCode).send({
      code: appError.code,
      message: appError.message,
      details: appError.details,
      requestId: request.id,
    });
  });
}

function mapFrameworkError(error: unknown): AppError | null {
  if (error && typeof error === "object" && "code" in error && error.code === "FST_REQ_FILE_TOO_LARGE") {
    return new AppError("Uploaded file is too large", "FILE_TOO_LARGE", 413);
  }

  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "FST_INVALID_MULTIPART_CONTENT_TYPE"
  ) {
    return new AppError("Content-Type must be multipart/form-data", "INVALID_MULTIPART", 400);
  }

  return null;
}
