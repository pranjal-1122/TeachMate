import React from 'react';

export interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  className = '',
}) => {
  const styles = {
    info: 'bg-tm-forest-800/10 dark:bg-tm-parchment/10 border-tm-forest-800/20 dark:border-tm-parchment/20 text-tm-forest-900 dark:text-tm-parchment',
    success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100',
    warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100',
    error: 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100',
  }[type];

  return (
    <div
      role="alert"
      className={`p-4 rounded-lg border text-sm transition-colors ${styles} ${className}`}
    >
      {title && <h4 className="font-bold text-sm mb-1">{title}</h4>}
      <div className="text-xs leading-relaxed opacity-90">{children}</div>
    </div>
  );
};
