import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const baseStyles = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm focus:ring-emerald-500",
  secondary: "bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 shadow-sm focus:ring-slate-500",
  destructive: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm focus:ring-rose-500",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-200",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export function ActionButton({
  variant = 'primary',
  size = 'md',
  isLoading,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

// Link variant for navigation
interface ActionLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ActionLink({ href, variant = 'primary', size = 'md', icon, children, className = '' }: ActionLinkProps) {
  return (
    <a
      href={href}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </a>
  );
}
