import type { JSX } from "react";
import type { ApiError } from "../api/errors";
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
        code: <strong>{error.code}</strong>
        {error.requestId ? ` · requestId: ${error.requestId}` : ""}
      </p>
    </div>
  );
}
