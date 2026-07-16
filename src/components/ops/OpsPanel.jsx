import React from 'react';

export function OpsPanel({ children, className = '', title }) {
  return (
    <section className={`border border-neutral-800 bg-[#121212] ${className}`}>
      <div className="p-6 sm:p-8">
        {title && (
          <h3 className="font-anton text-xl sm:text-2xl text-white mb-6">{title}</h3>
        )}
        {children}
      </div>
    </section>
  );
}

export function OpsStatCard({ label, value, loading, hint }) {
  return (
    <div className="border border-neutral-800 bg-[#121212] p-6 sm:p-8 flex flex-col items-center justify-center text-center min-h-[148px]">
      <p className="text-sm text-neutral-400">{label}</p>
      <p className="text-4xl sm:text-5xl font-anton text-white mt-4 tabular-nums tracking-tight">
        {loading ? '—' : value}
      </p>
      {hint && (
        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 mt-3">
          {hint}
        </p>
      )}
    </div>
  );
}

export function PeriodSelector({ timePeriod, onChange }) {
  const options = [
    { value: 7, label: '7 dias' },
    { value: 30, label: '30 dias' },
    { value: 90, label: '90 dias' },
    { value: 0, label: 'Tudo' },
  ];

  return (
    <div className="inline-flex border border-neutral-800 bg-[#121212]">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors border-r border-neutral-800 last:border-r-0 ${
            timePeriod === opt.value
              ? 'bg-[#eab308] text-black'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
