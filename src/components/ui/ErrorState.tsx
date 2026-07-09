import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Ocorreu um erro',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-critical-200 rounded-xl bg-critical-50/50 my-6">
      <AlertTriangle className="h-10 w-10 text-critical mb-4" />
      <h3 className="text-sm font-bold text-critical mb-1">{title}</h3>
      <p className="text-xs text-neutral-600 max-w-sm mb-5 leading-normal">{message}</p>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
export default ErrorState;
