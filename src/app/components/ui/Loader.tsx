import React from 'react';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = false 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const spinnerSize = {
    sm: 'border-2',
    md: 'border-3',
    lg: 'border-4'
  };

  const content = (
    <div className="flex flex-col items-center justify-center space-y-5 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 px-8 py-10 shadow-2xl shadow-blue-500/5 backdrop-blur-xl">
      <div className="relative">
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-emerald-500/10 blur-lg`} />
        <div className={`${sizeClasses[size]} ${spinnerSize[size]} border-slate-200 dark:border-slate-800 rounded-full animate-spin`} />
        <div className={`absolute top-0 left-0 ${sizeClasses[size]} ${spinnerSize[size]} border-t-blue-600 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin`} />
        <div className="absolute inset-0 m-auto w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse" />
      </div>

      {text && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-slate-600 dark:text-slate-300 text-sm font-semibold animate-pulse tracking-tight">
            {text}
          </span>
          <div className="flex space-x-1.5">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
