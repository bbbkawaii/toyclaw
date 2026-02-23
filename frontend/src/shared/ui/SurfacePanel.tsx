import type { JSX, PropsWithChildren, ReactNode } from "react";
import styles from "./SurfacePanel.module.css";

interface SurfacePanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function SurfacePanel({ title, subtitle, rightSlot, children }: SurfacePanelProps): JSX.Element {
  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
