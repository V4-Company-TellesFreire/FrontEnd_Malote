import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, helperText, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = React.useId();
    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={props.id || inputId}
            className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase"
          >
            {label}
            {props.required && <span className="text-critical ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={props.id || inputId}
            className={cn(
              'flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 ring-offset-white placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 transition-all duration-150',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-critical focus-visible:ring-critical',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <span className="text-xs text-critical font-medium animate-slide-in-bottom">
            {error}
          </span>
        )}
        {!error && helperText && (
          <span className="text-[10px] text-neutral-400 leading-normal">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
