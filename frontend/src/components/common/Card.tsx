import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'surface' | 'highlight';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-[#FDFCF7] dark:bg-surface-dark border border-line-light dark:border-line-dark shadow-subtle',
    surface: 'bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark shadow-subtle',
    highlight: 'bg-[#FDFCF7] dark:bg-surface-dark border-2 border-accent dark:border-accent-dark shadow-raised',
  };

  return (
    <div
      className={twMerge(
        clsx('rounded-card p-5 transition-shadow duration-150', variants[variant], className)
      )}
      {...props}
    >
      {children}
    </div>
  );
};
