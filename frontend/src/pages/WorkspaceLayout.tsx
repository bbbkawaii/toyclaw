import { motion } from "framer-motion";
import type { JSX } from "react";
import { StepRail } from "../shared/ui/StepRail";
import { useWorkflowStore, type WorkflowStep } from "../store/workflow-store";
import { LinearWorkflowPage } from "./LinearWorkflowPage";
import styles from "./WorkspaceLayout.module.css";

const STEP_SECTION_ID_MAP: Record<WorkflowStep, string> = {
  "image-input": "step-image-input",
  "cross-cultural": "step-cross-cultural",
  redesign: "step-redesign",
};

export function WorkspaceLayout(): JSX.Element {
  const state = useWorkflowStore();
  const currentStep = state.step;

  const stepItems = [
    {
      key: "image-input" as const,
      label: "图像输入",
      description: "上传并解析",
      enabled: true,
      done: Boolean(state.imageResult),
    },
    {
      key: "cross-cultural" as const,
      label: "跨文化分析",
      description: "市场分析",
      enabled: Boolean(state.requestId),
      done: Boolean(state.crossCulturalResult),
    },
    {
      key: "redesign" as const,
      label: "改款建议",
      description: "改款输出",
      enabled: Boolean(state.requestId && state.analysisId),
      done: Boolean(state.redesignResult),
    },
  ];

  const handleStepClick = (step: WorkflowStep): void => {
    const targetItem = stepItems.find((item) => item.key === step);
    if (!targetItem?.enabled) {
      return;
    }

    const section = document.getElementById(STEP_SECTION_ID_MAP[step]);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    state.setStep(step);
  };

  const handleReset = (): void => {
    state.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell">
      <motion.header
        className={styles.head}
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <div>
          <p className={styles.eyebrow}>玩具出海智能助手</p>
          <h1 className="neon-title">全球玩具改款实验室</h1>
          <p className={`muted ${styles.subline}`}>线性三步，自动衔接。</p>
        </div>
        <button className={styles.resetButton} type="button" onClick={handleReset}>
          重新开始
        </button>
      </motion.header>

      <div className={styles.grid}>
        <aside className={styles.leftRail}>
          <StepRail items={stepItems} currentStep={currentStep} onStepClick={handleStepClick} />
        </aside>

        <motion.main
          className={styles.main}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: "easeOut" }}
        >
          <LinearWorkflowPage />
        </motion.main>

      </div>
    </div>
  );
}
