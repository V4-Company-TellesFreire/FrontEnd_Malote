import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors duration-150 whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-50 text-brand-800',
        success: 'border-success-100 bg-success-50 text-success-800',
        warning: 'border-warning-100 bg-warning-50 text-warning-800',
        critical: 'border-critical-100 bg-critical-50 text-critical-800',
        info: 'border-info-100 bg-info-50 text-info-800',
        
        // Malote shifts
        manha: 'border-highlight-100 bg-highlight-50 text-highlight-800',
        tarde: 'border-info-100 bg-info-50 text-info-800',
        noite: 'border-purple-200 bg-purple-50 text-purple-800',

        // Urgency variants
        normal: 'border-success-100 bg-success-50 text-success-700',
        urgente: 'border-warning-100 bg-warning-50 text-warning-700 font-bold',
        'super-urgente': 'border-critical-200 bg-critical-100 text-critical-800 animate-pulse font-extrabold',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
}

function Badge({ className, variant, showDot, children, ...props }: BadgeProps) {
  const dotColorClass = React.useMemo(() => {
    switch (variant) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'critical': return 'bg-critical';
      case 'info': return 'bg-info';
      case 'super-urgente': return 'bg-critical';
      default: return 'bg-brand';
    }
  }, [variant]);

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', dotColorClass)} />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
