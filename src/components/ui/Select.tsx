import * as React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, helperText, children, ...props }, ref) => {
    const selectId = React.useId();
    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={props.id || selectId}
            className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase"
          >
            {label}
            {props.required && <span className="text-critical ml-0.5">*</span>}
          </label>
        )}
        <select
          id={props.id || selectId}
          className={cn(
            'flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-50 transition-all duration-150',
            error && 'border-critical focus-visible:ring-critical',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </select>
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
Select.displayName = 'Select';

export { Select };
