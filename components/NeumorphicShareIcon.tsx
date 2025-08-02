'use client';

import React from 'react';

interface NeumorphicShareIconProps {
  className?: string;
  onClick?: () => void;
}

export default function NeumorphicShareIcon({ 
  className = "w-8 h-8",
  onClick 
}: NeumorphicShareIconProps) {
  return (
    <button 
      onClick={onClick}
      className={`
        ${className}
        rounded-xl
        bg-surface
        shadow-[4px_4px_12px_rgba(0,0,0,0.15),-4px_-4px_12px_rgba(255,255,255,0.7)]
        dark:shadow-[4px_4px_12px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.1)]
        flex items-center justify-center
        p-2
        transition-all duration-200
        hover:shadow-[2px_2px_6px_rgba(0,0,0,0.2),-2px_-2px_6px_rgba(255,255,255,0.8)]
        dark:hover:shadow-[2px_2px_6px_rgba(0,0,0,0.5),-2px_-2px_6px_rgba(255,255,255,0.15)]
        active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.8)]
        dark:active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5),inset_-2px_-2px_4px_rgba(255,255,255,0.15)]
      `}
      title="Share match"
    >
<svg 
  viewBox="0 0 24 24" 
  fill="none" 
  className="w-full h-full"
>
  {/* Open U-shaped container */}
  <path 
    d="M6 12v6a2 2 0 002 2h8a2 2 0 002-2v-6" 
    stroke="#839c84" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    fill="none"
  />
  {/* Arrow pointing up and out from the opening */}
  <path 
    d="M12 12V4m0 0l-4 4m4-4l4 4" 
    stroke="#839c84" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  />
</svg>
    </button>
  );
}