import React from 'react';
import './Skeleton.css';

const Skeleton = ({
  width,
  height,
  borderRadius,
  variant = 'text',
  animated = true,
  className = '',
  style = {},
  ...rest
}) => {
  const combinedStyle = {
    width: width || (variant === 'circular' ? (height || '36px') : '100%'),
    height: height || (variant === 'circular' ? (width || '36px') : variant === 'text' ? '14px' : '24px'),
    borderRadius: borderRadius || (variant === 'circular' ? '50%' : variant === 'text' ? '6px' : '10px'),
    ...style
  };

  const classes = [
    'skeleton-element',
    `skeleton--${variant}`,
    animated ? 'skeleton--animated' : '',
    className
  ].filter(Boolean).join(' ');

  return <div className={classes} style={combinedStyle} {...rest} aria-hidden="true" />;
};

export default Skeleton;
