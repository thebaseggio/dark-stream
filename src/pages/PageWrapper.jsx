import React from 'react';
import { SITE_CONTAINER_CLASS } from '../components/SiteContainer';
export default function PageWrapper({ children }) {
  return (
    <div className={SITE_CONTAINER_CLASS}>
      <div className="mt-6 grid grid-cols-1 gap-4 pb-10 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}
