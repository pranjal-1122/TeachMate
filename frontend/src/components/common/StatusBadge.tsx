import React from 'react';

export interface StatusBadgeProps {
  status: 'diagnostic' | 'revising' | 'choice' | 'ready' | 'published' | string;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  className = '',
}) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      case 'ready':
      case 'draft':
        return 'bg-tm-forest-800/10 text-tm-forest-800 dark:bg-tm-parchment/10 dark:text-tm-parchment border-tm-forest-800/20 dark:border-tm-parchment/20';
      case 'choice':
      case 'awaiting_teacher_choice':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      case 'revising':
      case 'awaiting_reassessment':
        return 'bg-tm-terracotta/15 text-tm-terracotta dark:bg-tm-terracotta/20 dark:text-tm-terracotta border-tm-terracotta/30';
      case 'diagnostic':
      case 'awaiting_teacher_answers':
      default:
        return 'bg-tm-sage/20 text-tm-forest-800 dark:bg-tm-sage/30 dark:text-tm-sage border-tm-sage/30';
    }
  };

  const displayText = label || status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize transition-colors ${getBadgeStyle()} ${className}`}
    >
      {displayText}
    </span>
  );
};
