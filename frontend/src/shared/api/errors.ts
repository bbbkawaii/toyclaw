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
    const isTimeout = error.code === "ECONNABORTED" || /timeout/i.test(error.message);

    if (isTimeout) {
      return new ApiError({
        message: "模型响应超时。已等待较长时间，请重试或更换更小图片后再试。",
        code: "REQUEST_TIMEOUT",
        status: error.response?.status,
        requestId: payload?.requestId,
        details: payload?.details,
      });
    }

    return new ApiError({
      message: "请求失败，请稍后重试。",
      code: payload?.code || "HTTP_ERROR",
      status: error.response?.status,
      requestId: payload?.requestId,
      details: payload?.details,
    });
  }

  if (error instanceof Error) {
    return new ApiError({
      message: "系统处理失败，请稍后再试。",
      code: "INTERNAL_ERROR",
    });
  }

  return new ApiError({
    message: "未知错误",
    code: "UNKNOWN_ERROR",
  });
}
