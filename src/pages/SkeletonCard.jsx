import React from 'react';

export default function SkeletonCard({ variant = 'default' }) {
  if (variant === 'short') {
    return (
      <div className="relative flex-shrink-0 w-44 animate-pulse">
        <div className="relative border border-dark-border overflow-hidden bg-dark-panel">
          <div className="w-full aspect-[9/16] bg-zinc-800" />
        </div>
        <div className="mt-2 h-3 bg-zinc-800 rounded w-full" />
      </div>
    );
  }

  return (
    <div className="relative w-64 max-w-full flex-shrink-0 animate-pulse sm:w-72 lg:w-80 xl:w-[300px]">
      <div className="relative overflow-hidden rounded-lg border border-dark-border bg-dark-panel">
        <div className="aspect-video w-full rounded-lg bg-zinc-800" />
      </div>
      <div className="mt-2 h-4 bg-zinc-800 rounded w-full" />
      <div className="mt-1 h-3 bg-zinc-800 rounded w-2/3" />
    </div>
  );
}
