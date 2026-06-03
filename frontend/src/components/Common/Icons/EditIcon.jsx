import React from 'react';

const EditIcon = ({ size = 'md', color = 'currentColor', className = '', ...props }) => {
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
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  );
};

export default EditIcon;