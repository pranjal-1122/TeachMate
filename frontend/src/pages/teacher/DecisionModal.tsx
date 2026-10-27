import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/ProgressBar';
import { AlertTriangle, ShieldAlert, ArrowRight, Save, RotateCcw } from 'lucide-react';

interface DecisionModalProps {
  score: number;
  isOpen: boolean;
  onProceedAnyway: () => Promise<void>;
  onContinueRevision: () => Promise<void>;
  onSaveForLater: () => Promise<void>;
  isSubmitting: boolean;
}

export const DecisionModal: React.FC<DecisionModalProps> = ({
  score,
  isOpen,
  onProceedAnyway,
  onContinueRevision,
  onSaveForLater,
  isSubmitting,
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#192A25]/70 backdrop-blur-sm"
    >
      <div className="max-w-lg w-full bg-[#FDFCF7] dark:bg-surface-dark border-2 border-state-warning rounded-modal p-6 sm:p-8 shadow-raised">
        <div className="flex items-center gap-3 text-state-warning mb-4">
          <ShieldAlert className="w-8 h-8 shrink-0" />
          <div>
            <h3 id="decision-modal-title" className="text-xl font-bold text-structure-light dark:text-structure-dark leading-tight">
              Maximum Revision Limit Reached
            </h3>
            <p className="text-xs text-slate-muted dark:text-slate-darkMuted mt-0.5">
              3 automated revision rounds completed with score at {Math.round(score)}% (Threshold: 80%)
            </p>
          </div>
        </div>

        <Alert type="warning" className="mb-6 text-xs leading-relaxed">
          The TeachMate agent has safely paused execution to prevent an infinite revision loop. You have the choice to proceed to lesson generation with an explicit disclaimer flag, continue voluntary revision, or save your progress.
        </Alert>

        {/* Mandatory Acknowledgment Checkbox for Proceed Anyway */}
        <div className="p-4 rounded-card bg-surface-light dark:bg-[#1E3029] border border-line-light dark:border-line-dark mb-6">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-accent focus:ring-accent accent-accent"
            />
            <span className="text-xs font-semibold text-structure-light dark:text-structure-dark leading-snug">
              I explicitly acknowledge that conceptual readiness is incomplete ({Math.round(score)}%). I understand the resulting lesson will carry a readiness override note.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <Button
            variant="primary"
            disabled={!acknowledged || isSubmitting}
            isLoading={isSubmitting}
            onClick={onProceedAnyway}
            className="w-full font-bold justify-between"
          >
            <span>Proceed to Lesson Generation Anyway</span>
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={onContinueRevision}
              className="justify-center text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Continue Revising
            </Button>
            <Button
              variant="secondary"
              disabled={isSubmitting}
              onClick={onSaveForLater}
              className="justify-center text-xs"
            >
              <Save className="w-3.5 h-3.5 mr-1" />
              Save and Exit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
