import React from 'react';

interface ProgressBarProps {
  progress: number; // 0-100
  totalBytes?: number;
  receivedBytes?: number;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  totalBytes,
  receivedBytes,
  className = ''
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;