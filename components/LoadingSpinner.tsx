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
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative mb-6">
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20`}></div>
        <div className={`${sizeClasses[size]} flex items-center justify-center text-blue-400`}>
          <Icon name="loader" className="w-8 h-8 animate-spin" />
        </div>
      </div>
      <p className="text-sm text-center text-gray-400">{message}</p>
    </div>
  );
};

export default LoadingSpinner;