// import React from 'react';

// const Icon = ({ 
//   name, 
//   size = 'md', 
//   color = 'currentColor', 
//   className = '',
//   ...props 
// }) => {
//   const getSize = () => {
//     switch (size) {
//       case 'sm': return 16;
//       case 'lg': return 24;
//       case 'xl': return 32;
//       default: return 20;
//     }
//   };

//   const iconProps = {
//     width: getSize(),
//     height: getSize(),
//     fill: color,
//     className: `icon icon-${size} ${className}`,
//     ...props
//   };

//   const icons = {
//     eye: (
//       <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//         <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
//         <circle cx="12" cy="12" r="3"></circle>
//       </svg>
//     ),
//     edit: (
//       <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//         <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
//         <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
//       </svg>
//     ),
//     delete: (
//       <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//         <path d="M3 6h18"></path>
//         <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
//         <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
//       </svg>
//     ),
//     plus: (
//       <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//         <path d="M12 5v14m-7-7h14"></path>
//       </svg>
//     ),
//     download: (
//       <svg {...iconProps} viewBox="0 0 24 24" fill="currentColor">
//         <path fillRule="evenodd" d="M13 11.15V4a1 1 0 1 0-2 0v7.15L8.78 8.374a1 1 0 1 0-1.56 1.25l4 5a1 1 0 0 0 1.56 0l4-5a1 1 0 1 0-1.56-1.25L13 11.15Z" clipRule="evenodd"/>
//         <path fillRule="evenodd" d="M9.657 15.874 7.358 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2.358l-2.3 2.874a3 3 0 0 1-4.685 0ZM17 16a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H17Z" clipRule="evenodd"/>
//       </svg>
//     ),
//     search: (
//       <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//         <circle cx="11" cy="11" r="8"></circle>
//         <path d="m21 21-4.35-4.35"></path>
//       </svg>
//     )
//   };

//   return icons[name] || null;
// };

// export default Icon;

import React from 'react';

const Icon = ({ 
  name, 
  size = 'md', 
  color = 'currentColor', 
  className = '',
  ...props 
}) => {
  const getSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      case 'xl': return 32;
      default: return 20;
    }
  };

  const iconProps = {
    width: getSize(),
    height: getSize(),
    className: `icon icon-${size} ${className}`,
    ...props
  };

  const icons = {
    eye: (
      <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    ),
    edit: (
      <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    ),
    delete: (
      <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M3 6h18"></path>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      </svg>
    ),
    plus: (
      <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    ),
    download: (
      <svg {...iconProps} viewBox="0 0 24 24" fill={color}>
        <path fillRule="evenodd" d="M13 11.15V4a1 1 0 1 0-2 0v7.15L8.78 8.374a1 1 0 1 0-1.56 1.25l4 5a1 1 0 0 0 1.56 0l4-5a1 1 0 1 0-1.56-1.25L13 11.15Z" clipRule="evenodd"/>
        <path fillRule="evenodd" d="M9.657 15.874 7.358 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2.358l-2.3 2.874a3 3 0 0 1-4.685 0ZM17 16a1 1 0 1 0 0 2h.01a1 1 0 1 0 0-2H17Z" clipRule="evenodd"/>
      </svg>
    ),
    search: (
      <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
    ),
    power: (
      <svg {...iconProps} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
        <line x1="12" y1="2" x2="12" y2="12"></line>
      </svg>
    )
  };

  return icons[name] || null;
};

export default Icon;