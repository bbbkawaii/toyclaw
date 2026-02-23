import type { JSX } from "react";
import type { ApiError } from "../api/errors";
import { toErrorCodeLabel } from "../i18n/labels";
import styles from "./InlineError.module.css";

interface InlineErrorProps {
  error: ApiError | null;
}

export function InlineError({ error }: InlineErrorProps): JSX.Element | null {
  if (!error) {
    return null;
  }

  return (
    <div className={styles.errorBox} role="alert">
      <p className={styles.message}>{error.message}</p>
      <p className={styles.meta}>
        错误类型: <strong>{toErrorCodeLabel(error.code)}</strong>
        {error.requestId ? ` · 请求编号: ${error.requestId}` : ""}
      </p>
    </div>
  );
}
