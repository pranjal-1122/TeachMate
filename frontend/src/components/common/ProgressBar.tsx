import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressBarProps {
  value: number; // 0 to 100
  label?: string;
  showNumeric?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showNumeric = true,
  className,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={twMerge('w-full', className)}>
      {(label || showNumeric) && (
        <div className="flex justify-between items-center text-xs font-medium text-slate-muted dark:text-slate-darkMuted mb-1.5">
          {label && <span>{label}</span>}
          {showNumeric && <span className="tabular-nums font-semibold">{clamped}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
        className="w-full h-2.5 bg-[#E2DEC9] dark:bg-[#1E3029] rounded-full overflow-hidden"
      >
        <div
          className="h-full bg-accent dark:bg-accent-dark transition-all duration-300 ease-out rounded-full"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className,
}) => {
  const styles = {
    info: 'bg-[#EBF0ED] dark:bg-[#1C2F28] border-[#A8BDAD] dark:border-[#385246] text-structure-light dark:text-structure-dark',
    success: 'bg-[#E9F3ED] dark:bg-[#1C3328] border-state-success text-state-success dark:text-[#A1DEBC]',
    warning: 'bg-[#FBF5E8] dark:bg-[#332B1C] border-state-warning text-[#573E10] dark:text-[#E6C682]',
    error: 'bg-[#FAEBEA] dark:bg-[#341F1D] border-state-danger text-state-danger dark:text-[#F3A59E]',
  };

  return (
    <div
      role="alert"
      className={twMerge(
        clsx('p-4 rounded-card border text-sm', styles[type], className)
      )}
    >
      {title && <h4 className="font-semibold text-base mb-1">{title}</h4>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
};

interface StatusBadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'accent';
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'neutral',
  children,
  className,
}) => {
  const styles = {
    neutral: 'bg-surface-light dark:bg-surface-dark text-slate-reading dark:text-structure-dark border border-line-light dark:border-line-dark',
    success: 'bg-[#E3EFE8] dark:bg-[#1C3328] text-state-success dark:text-[#A1DEBC] border border-[#A5CEB9]',
    warning: 'bg-[#F9F1DF] dark:bg-[#332B1C] text-state-warning dark:text-[#E6C682] border border-[#E0C995]',
    danger: 'bg-[#F7E5E4] dark:bg-[#341F1D] text-state-danger dark:text-[#F3A59E] border border-[#E69F9B]',
    accent: 'bg-accent/15 dark:bg-accent-dark/20 text-[#8C3A27] dark:text-[#F0A391] border border-accent/30',
  };

  return (
    <span
      className={twMerge(
        clsx('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold select-none', styles[variant], className)
      )}
    >
      {children}
    </span>
  );
};
