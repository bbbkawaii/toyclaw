import type { JSX } from "react";
import type { ApiError } from "../api/errors";
import { toErrorCodeLabel } from "../i18n/labels";

interface InlineErrorProps {
  error: ApiError | null;
}

export function InlineError({ error }: InlineErrorProps): JSX.Element | null {
  if (!error) {
    return null;
  }

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600" role="alert">
      <p className="text-sm font-medium">{error.message}</p>
      <p className="text-xs text-red-500 mt-1">
        错误类型: <strong>{toErrorCodeLabel(error.code)}</strong>
      </p>
    </div>
  );
}
