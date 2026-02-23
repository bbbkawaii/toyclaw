import axios from "axios";
import type { AppErrorResponse } from "../types/api";

export class ApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(input: {
    message: string;
    code: string;
    status?: number;
    requestId?: string;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiError";
    this.code = input.code;
    this.status = input.status;
    this.requestId = input.requestId;
    this.details = input.details;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as Partial<AppErrorResponse> | undefined;
    return new ApiError({
      message: payload?.message || error.message || "请求失败",
      code: payload?.code || "HTTP_ERROR",
      status: error.response?.status,
      requestId: payload?.requestId,
      details: payload?.details,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      message: error.message,
      code: "INTERNAL_ERROR",
    });
  }

  return new ApiError({
    message: "未知错误",
    code: "UNKNOWN_ERROR",
  });
}

