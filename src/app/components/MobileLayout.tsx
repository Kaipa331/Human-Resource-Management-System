import { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function MobileLayout({ children, title, subtitle, actions }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Mobile Header */}
      {(title || subtitle || actions) && (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-4 md:hidden">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {title && (
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className="ml-4 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-4 md:px-6 md:py-6 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}

export function MobileCard({ children, className = "", title, subtitle }: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          {title && (
            <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

export function MobileGrid({ children, cols = 1, gap = 4 }: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: number;
}) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[cols]} gap-${gap}`}>
      {children}
    </div>
  );
}

export function MobileStatCard({ 
  title, 
  value, 
  change, 
  icon: Icon,
  trend = 'up'
}: {
  title: string;
  value: string | number;
  change?: string;
  icon?: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-slate-600 dark:text-slate-400'
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">
            {value}
          </p>
          {change && (
            <p className={`text-xs mt-1 ${trendColors[trend]}`}>
              {change}
            </p>
          )}
        </div>
        {Icon && (
          <div className="ml-3 flex-shrink-0">
            <Icon className="w-8 h-8 text-slate-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function MobileTable({ 
  headers, 
  rows, 
  emptyMessage = "No data available"
}: {
  headers: { key: string; label: string; className?: string }[];
  rows: Record<string, any>[];
  emptyMessage?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {headers.map((header) => (
                <th
                  key={header.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider ${header.className || ''}`}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                {headers.map((header) => (
                  <td key={header.key} className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                    {row[header.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {rows.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {rows.map((row, index) => (
              <div key={index} className="p-4">
                {headers.map((header) => (
                  <div key={header.key} className="flex justify-between py-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {header.label}
                    </span>
                    <span className="text-sm text-slate-900 dark:text-slate-100 text-right">
                      {row[header.key]}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
