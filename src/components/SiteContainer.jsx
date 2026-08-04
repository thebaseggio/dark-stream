import React from 'react';

export const SITE_CONTAINER_CLASS = 'w-full max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-12';

export default function SiteContainer({ children, className = '', as: Component = 'div' }) {
  return (
    <Component className={`${SITE_CONTAINER_CLASS}${className ? ` ${className}` : ''}`}>
      {children}
    </Component>
  );
}
