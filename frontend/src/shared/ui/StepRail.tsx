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

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

export function StepRail(props: StepRailProps): JSX.Element {
  return (
    <motion.nav
      className={styles.rail}
      aria-label="流程步骤导航"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {props.items.map((item, index) => {
        const isActive = props.currentStep === item.key;

        return (
          <motion.button
            key={item.key}
            type="button"
            className={styles.stepButton}
            variants={itemVariants}
            whileHover={item.enabled ? { x: 4, transition: { duration: 0.2 } } : undefined}
            whileTap={item.enabled ? { scale: 0.98 } : undefined}
            data-active={isActive}
            data-done={item.done}
            disabled={!item.enabled}
            onClick={() => props.onStepClick(item.key)}
          >
            <span className={styles.badge}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.meta}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.desc}>{item.description}</span>
            </span>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}
