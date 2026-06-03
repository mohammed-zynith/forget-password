import React from 'react';

const EyeIcon = ({ size = 'md', color = 'currentColor', className = '', ...props }) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      case 'xl': return 32;
      default: return 20;
    }
  };

  return (
    <svg 
      width={getSize()}
      height={getSize()}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2"
      className={`icon icon-${size} ${className}`}
      {...props}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  );
};

export default EyeIcon;