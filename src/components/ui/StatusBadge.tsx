import { STATUS_META, type ServiceOrderStatus } from '../../lib/constants';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status: ServiceOrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  if (!meta) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap border',
        className
      )}
      style={{
        backgroundColor: meta.bgColor,
        color: meta.textColor,
        borderColor: `${meta.color}33`, // 20% opacity border
      }}
    >
      {status}
    </span>
  );
}
export default StatusBadge;
