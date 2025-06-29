// src/pages/SkeletonCard.jsx

import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="border-2 border-zinc-800 rounded-lg p-3 max-w-[280px] mx-auto">
      <div className="bg-zinc-800 h-40 rounded-md animate-pulse"></div>
      <div className="mt-4 h-6 bg-zinc-800 rounded w-3/4 mx-auto animate-pulse"></div>
      <div className="mt-6 flex justify-between gap-2">
        <div className="h-10 bg-zinc-800 rounded w-1/2 animate-pulse"></div>
        <div className="h-10 bg-zinc-800 rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
  );
}