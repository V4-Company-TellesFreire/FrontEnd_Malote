import * as React from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SearchableDropdownProps {
  label: string;
  placeholder: string;
  searchPlaceholder?: string;
  options: string[]; // Unique string values
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SearchableDropdown({
  label,
  placeholder,
  searchPlaceholder = 'Buscar...',
  options,
  value,
  onChange,
  className,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = React.useMemo(() => {
    return options.filter((opt) =>
      (opt || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Clear search term when closed
  React.useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const displayValue = value || placeholder;

  return (
    <div ref={containerRef} className={cn('relative w-full flex flex-col gap-1', className)}>
      {label && (
        <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase select-none">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-neutral-350 bg-white px-3 py-2 text-sm text-neutral-850 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 select-none cursor-pointer transition-all duration-150',
          isOpen && 'border-brand ring-2 ring-brand/20'
        )}
      >
        <span className={cn('truncate', !value && 'text-neutral-450')}>{displayValue}</span>
        <ChevronDown className={cn('h-4 w-4 text-neutral-450 shrink-0 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full min-w-[200px] rounded-lg border border-neutral-200 bg-white p-2.5 shadow-lg animate-scale-in flex flex-col gap-2 max-h-[300px]">
          {/* Inner Search Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full rounded-md border border-neutral-250 bg-neutral-50 pl-8 pr-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-brand focus:bg-white transition-all"
              autoFocus
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-200 flex-1 flex flex-col gap-0.5 max-h-[200px]">
            {/* Reset / All option */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={cn(
                'flex items-center justify-between w-full rounded px-2 py-1.5 text-left text-xs font-semibold hover:bg-neutral-100 transition-colors text-neutral-700 select-none cursor-pointer',
                !value && 'bg-brand-50/50 text-brand'
              )}
            >
              <span>Todos</span>
              {!value && <Check className="h-3.5 w-3.5 text-brand" />}
            </button>

            {filteredOptions.length === 0 ? (
              <span className="text-[10px] text-neutral-450 font-bold p-2 text-center select-none">
                Nenhuma opção encontrada
              </span>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex items-center justify-between w-full rounded px-2 py-1.5 text-left text-xs font-semibold hover:bg-neutral-100 transition-colors text-neutral-700 select-none cursor-pointer',
                    value === opt && 'bg-brand-50/50 text-brand font-bold'
                  )}
                >
                  <span className="truncate">{opt}</span>
                  {value === opt && <Check className="h-3.5 w-3.5 text-brand" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default SearchableDropdown;
