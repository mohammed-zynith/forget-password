import React from 'react';

const PowerIcon = ({ size = 'md', color = 'currentColor', className = '', ...props }) => {
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
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
      <line x1="12" y1="2" x2="12" y2="12"></line>
    </svg>
  );
};

export default PowerIcon;