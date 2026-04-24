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
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Outer spinning ring */}
        <div className={`${sizeClasses[size]} ${spinnerSize[size]} border-blue-500/30 rounded-full animate-spin`}></div>
        
        {/* Inner spinning ring (opposite direction) */}
        <div className={`absolute top-0 left-0 ${sizeClasses[size]} ${spinnerSize[size]} border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin`}></div>
        
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      </div>
      
      {text && (
        <div className="flex items-center space-x-2">
          <span className="text-gray-600 dark:text-gray-400 text-sm font-medium animate-pulse">
            {text}
          </span>
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

export default Loader;
