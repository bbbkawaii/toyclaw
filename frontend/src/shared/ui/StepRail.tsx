import { motion } from "framer-motion";
import type { JSX } from "react";
import type { WorkflowStep } from "../../store/workflow-store";
import styles from "./StepRail.module.css";

export interface StepRailItem {
  key: WorkflowStep;
  label: string;
  description: string;
  enabled: boolean;
  done: boolean;
}

interface StepRailProps {
  items: StepRailItem[];
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
}

export function StepRail(props: StepRailProps): JSX.Element {
  return (
    <nav className={styles.rail} aria-label="流程步骤导航">
      {props.items.map((item, index) => {
        const isActive = props.currentStep === item.key;

        return (
          <motion.button
            key={item.key}
            type="button"
            className={styles.stepButton}
            whileHover={item.enabled ? { y: -2, scale: 1.01 } : undefined}
            whileTap={item.enabled ? { scale: 0.995 } : undefined}
            data-active={isActive}
            data-done={item.done}
            disabled={!item.enabled}
            onClick={() => props.onStepClick(item.key)}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <span className={styles.badge}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.meta}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.desc}>{item.description}</span>
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}
