import * as React from 'react';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex border-b border-neutral-200 w-full overflow-x-auto scrollbar-hide', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-xs font-semibold tracking-wide border-b-2 whitespace-nowrap transition-all duration-200',
              isActive
                ? 'border-brand text-brand font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 hover:border-neutral-300'
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] font-bold border transition-colors duration-200',
                  isActive
                    ? 'bg-brand text-white border-brand'
                    : 'bg-neutral-100 text-neutral-600 border-neutral-200'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
export default Tabs;
