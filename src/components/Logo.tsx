import React from 'react';
import pagionLogo from '@/assets/pagion-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const textSizes = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  xl: 'text-4xl',
};

export function Logo({ size = 'md', showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <img src={pagionLogo} alt="Pagion" className={`${sizeClasses[size]} object-contain`} />
      {showText && (
        <span className={`${textSizes[size]} font-bold pagion-gradient-text`}>
          Pagion
        </span>
      )}
    </div>
  );
}
