import { cn } from '../../lib/utils';

export interface ChipProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, isSelected = false, onClick, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold select-none cursor-pointer transition-all duration-150 active:scale-95 shadow-xs',
        isSelected
          ? 'bg-brand-50 border-brand text-brand shadow-sm font-bold'
          : 'bg-white border-neutral-300 text-neutral-600 hover:bg-neutral-50',
        className
      )}
    >
      {label}
    </button>
  );
}
export default Chip;
