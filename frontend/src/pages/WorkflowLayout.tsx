import { type JSX } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AppHeader } from "../shared/ui/AppHeader";
import { WizardProgress } from "../shared/ui/WizardProgress";

export function WorkflowLayout(): JSX.Element {
  const location = useLocation();

  const currentStep: 1 | 2 | 3 = location.pathname.includes("step3")
    ? 3
    : location.pathname.includes("step2")
      ? 2
      : 1;

  return (
    <div className="mesh-gradient min-h-screen">
      <AppHeader variant="glass" />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <WizardProgress currentStep={currentStep} />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
