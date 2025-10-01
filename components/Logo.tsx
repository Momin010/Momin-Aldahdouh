import React from 'react';

interface LogoProps {
    className?: string;
    iconOnly?: boolean;
}

// Using the provided logo as an inline SVG component
export const Logo: React.FC<LogoProps> = ({ className, iconOnly = false }) => {
    const icon = (
        <svg width="32" height="32" viewBox="0 0 196 181" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
            <path d="M68.5 28.5L38.5 13.5L8 28.5L23.5 43.5L8 58.5L38.5 73.5L53.5 58.5L68.5 73.5L83.5 58.5L98.5 73.5L113.5 58.5L128.5 43.5L113.5 28.5L98.5 43.5L83.5 28.5L68.5 13.5L53.5 28.5M68.5 28.5L83.5 43.5L68.5 58.5L53.5 43.5L68.5 28.5Z" stroke="white" strokeWidth="15"/>
            <path d="M68.5 73.5L38.5 88.5L8 73.5L23.5 88.5L8 103.5L38.5 118.5L53.5 103.5L68.5 118.5L83.5 103.5L98.5 118.5L113.5 103.5L128.5 88.5L113.5 73.5L98.5 88.5L83.5 73.5L68.5 88.5L53.5 73.5M68.5 73.5L83.5 88.5L68.5 103.5L53.5 88.5L68.5 73.5Z" stroke="white" strokeWidth="15"/>
            <path d="M68.5 118.5L38.5 133.5L8 118.5L23.5 133.5L8 148.5L38.5 163.5L53.5 148.5L68.5 163.5L83.5 148.5L98.5 163.5L113.5 148.5L128.5 133.5L113.5 118.5L98.5 133.5L83.5 118.5L68.5 133.5L53.5 118.5M68.5 118.5L83.5 133.5L68.5 148.5L53.5 133.5L68.5 118.5Z" stroke="white" strokeWidth="15"/>
        </svg>
    );

    if (iconOnly) {
        return <div className={className}>{icon}</div>;
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {icon}
            <span className="text-2xl font-bold tracking-tight text-white">MominAI</span>
        </div>
    );
};
