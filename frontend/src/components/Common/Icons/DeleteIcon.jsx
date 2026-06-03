import React from 'react';

const DeleteIcon = ({ size = 'md', color = 'currentColor', className = '', ...props }) => {
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
      <path d="M3 6h18"></path>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );
};

export default DeleteIcon;