import React from 'react';

const PlusIcon = ({ size = 'md', color = 'currentColor', className = '', ...props }) => {
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
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
};

export default PlusIcon;