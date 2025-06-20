// src/components/PageWrapper.jsx
import React from 'react';

export default function PageWrapper({ children }) {
  return (
    <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-8 lg:px-12">
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
        {children}
      </div>
    </div>
  );
}
