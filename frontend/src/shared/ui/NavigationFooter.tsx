import { type JSX } from "react";

interface NavigationFooterProps {
  onBack?: () => void;
  backLabel?: string;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  extras?: JSX.Element;
}

export function NavigationFooter({
  onBack,
  backLabel = "上一步",
  onNext,
  nextLabel = "下一步",
  nextDisabled = false,
  nextLoading = false,
  extras,
}: NavigationFooterProps): JSX.Element {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 animate-fade-in-up stagger-3">
      {onBack ? (
        <button
          onClick={onBack}
          className="w-full sm:w-auto px-8 py-4 text-toy-secondary font-bold hover:text-primary transition-colors flex items-center justify-center space-x-2 group"
        >
          <i className="fas fa-chevron-left text-xs group-hover:-translate-x-1 transition-transform" />
          <span>{backLabel}</span>
        </button>
      ) : (
        <div />
      )}

      <div className="flex items-center space-x-4">
        {extras}
        {onNext && (
          <button
            onClick={onNext}
            disabled={nextDisabled || nextLoading}
            className="w-full sm:w-auto px-12 py-5 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all hover:shadow-2xl hover:shadow-primary/30 text-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {nextLoading ? (
              <i className="fas fa-spinner fa-spin" />
            ) : (
              <>
                <span>{nextLabel}</span>
                <i className="fas fa-arrow-right" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
