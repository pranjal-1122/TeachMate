import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  type = 'button',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-card transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-accent text-[#192A25] hover:bg-accent-hover font-semibold dark:bg-accent-dark dark:text-[#192A25] focus-visible:outline-accent',
    secondary: 'bg-surface-light text-structure-light hover:bg-[#DDD8CB] dark:bg-surface-dark dark:text-structure-dark dark:hover:bg-[#2C3F36] border border-line-light dark:border-line-dark',
    outline: 'bg-transparent text-structure-light dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark border border-line-light dark:border-line-dark',
    danger: 'bg-state-danger text-[#F5F3ED] hover:bg-[#8F352E] focus-visible:outline-state-danger',
    ghost: 'bg-transparent text-slate-reading dark:text-structure-dark hover:bg-surface-light dark:hover:bg-surface-dark',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};
