import type { JSX } from "react";
import styles from "./LoadingPulse.module.css";

interface LoadingPulseProps {
  label?: string;
}

export function LoadingPulse({ label = "处理中..." }: LoadingPulseProps): JSX.Element {
  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.dot} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
