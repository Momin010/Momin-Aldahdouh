import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 4);
    }, 4000); // 4 second phases

    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const getPhaseContent = () => {
    switch (animationPhase) {
      case 0:
        return {
          icon: 'brain',
          characters: ['search', 'lightbulb', 'target'],
          color: 'text-blue-400',
          text: 'Analyzing requirements...'
        };
      case 1:
        return {
          icon: 'code',
          characters: ['code', 'wrench', 'smartphone'],
          color: 'text-green-400',
          text: 'Crafting components...'
        };
      case 2:
        return {
          icon: 'zap',
          characters: ['zap', 'rocket', 'target'],
          color: 'text-yellow-400',
          text: 'Optimizing performance...'
        };
      case 3:
        return {
          icon: 'sparkles',
          characters: ['sparkles', 'palette', 'trophy'],
          color: 'text-purple-400',
          text: 'Finalizing masterpiece...'
        };
      default:
        return {
          icon: 'brain',
          characters: ['bot', 'laptop', 'star'],
          color: 'text-gray-400',
          text: 'Working...'
        };
    }
  };

  const phaseContent = getPhaseContent();

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className="relative mb-6">
        {/* Background circle */}
        <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20`}></div>

        {/* Floating icons */}
        {phaseContent.characters.map((iconName, index) => (
          <motion.div
            key={index}
            className="absolute"
            initial={{ scale: 0, rotate: 0 }}
            animate={{
              scale: [0, 1.2, 1],
              rotate: [0, 180, 360],
              x: [0, Math.sin(index * 120) * 30, 0],
              y: [0, Math.cos(index * 120) * 30, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: index * 0.5,
              ease: "easeInOut"
            }}
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Icon name={iconName} className="w-5 h-5 text-white/80" />
          </motion.div>
        ))}

        {/* Central icon */}
        <motion.div
          className={`${sizeClasses[size]} flex items-center justify-center ${phaseContent.color}`}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Icon name={phaseContent.icon} className="w-8 h-8" />
        </motion.div>
      </div>

      {/* Pulsing dots */}
      <div className="flex gap-2 mb-4">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-3 h-3 bg-white/40 rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2
            }}
          />
        ))}
      </div>

      <motion.p
        className={`text-sm text-center ${phaseContent.color}`}
        key={phaseContent.text}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {phaseContent.text}
      </motion.p>
    </div>
  );
};

export default LoadingSpinner;