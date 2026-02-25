import { type JSX } from "react";

interface WizardProgressProps {
  currentStep: 1 | 2 | 3;
}

export function WizardProgress({ currentStep }: WizardProgressProps): JSX.Element {
  const steps = [1, 2, 3] as const;

  return (
    <div className="flex items-center justify-center mb-12 animate-fade-in-up">
      <div className="flex items-center space-x-4">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center space-x-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                step < currentStep
                  ? "bg-primary text-white"
                  : step === currentStep
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-white text-toy-secondary border border-black/10"
              }`}
            >
              {step < currentStep ? (
                <i className="fas fa-check text-xs" />
              ) : (
                step
              )}
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-1 w-12 rounded-full ${
                  step < currentStep ? "bg-primary" : "bg-black/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
