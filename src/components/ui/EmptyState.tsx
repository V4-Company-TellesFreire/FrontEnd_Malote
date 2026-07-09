import * as React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = <HelpCircle className="h-10 w-10 text-neutral-400" />,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-neutral-300 rounded-xl bg-neutral-50/50 my-6">
      <div className="mb-4">{icon}</div>
      <h3 className="text-sm font-bold text-neutral-850 mb-1">{title}</h3>
      <p className="text-xs text-neutral-500 max-w-sm mb-5 leading-normal">{description}</p>
      {actionText && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
export default EmptyState;
