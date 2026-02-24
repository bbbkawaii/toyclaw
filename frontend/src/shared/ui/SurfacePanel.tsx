import { motion } from "framer-motion";
import type { JSX, PropsWithChildren, ReactNode } from "react";
import styles from "./SurfacePanel.module.css";

interface SurfacePanelProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function SurfacePanel({ title, subtitle, rightSlot, children }: SurfacePanelProps): JSX.Element {
  return (
    <motion.section
      className={styles.panel}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <header className={styles.header}>
        <div>
          <h2 className={styles.title}>{title}</h2>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {rightSlot ? <div>{rightSlot}</div> : null}
      </header>
      <div className={styles.body}>{children}</div>
    </motion.section>
  );
}
