import React from 'react';

const SIZE_CLASSES = {
  sm: 'h-5 w-5 border',
  md: 'h-8 w-8 border-2',
  lg: 'h-10 w-10 border-2',
  xl: 'h-12 w-12 border-2',
};

export default function LoadingSpinner({
  size = 'md',
  label,
  className = '',
  inline = false,
}) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className={`${inline ? 'inline-flex flex-row items-center gap-2' : 'flex flex-col items-center gap-3'} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label || 'Carregando'}
    >
      <div
        className={`${sizeClass} rotate-45 animate-spin border-zinc-800 border-t-amber-500`}
        aria-hidden="true"
      />
      {label ? (
        <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">{label}</p>
      ) : null}
    </div>
  );
}
