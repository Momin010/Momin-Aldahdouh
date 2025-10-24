import React from 'react';
import { Icon } from './Icon';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-purple-500 mb-4`} />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
};

export default LoadingSpinner;