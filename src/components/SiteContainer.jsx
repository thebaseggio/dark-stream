import React from 'react';

export const SITE_CONTAINER_CLASS = 'w-full max-w-[1440px] mx-auto px-6 md:px-12';

export default function SiteContainer({ children, className = '', as: Component = 'div', ...props }) {
  return (
    <Component className={`${SITE_CONTAINER_CLASS}${className ? ` ${className}` : ''}`} {...props}>
      {children}
    </Component>
  );
}
