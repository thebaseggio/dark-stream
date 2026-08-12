import React from 'react';

export function SettingRow({
  label,
  value,
  onClick,
  isToggle = false,
  enabled = false,
  onToggle,
  disabled = false,
}) {
  const rowClass =
    'flex items-center justify-between px-4 py-3 border-b border-zinc-900/80 text-zinc-300 font-mono text-xs uppercase tracking-wider transition-colors';

  if (isToggle) {
    return (
      <div className={`${rowClass} ${disabled ? 'opacity-40' : ''}`}>
        <span>{label}</span>
        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className={`border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider transition-colors rounded-none ${
            enabled
              ? 'border-amber-500/60 text-amber-500 hover:border-amber-500'
              : 'border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
          }`}
          aria-pressed={enabled}
        >
          {enabled ? '[ LIGADO ]' : '[ DESLIGADO ]'}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${rowClass} w-full text-left hover:bg-amber-500/10 hover:text-amber-400 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-300`}
    >
      <span>{label}</span>
      {value && <span className="text-amber-500 font-bold">{value}</span>}
    </button>
  );
}

export function SettingOptionRow({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between px-4 py-3 border-b border-zinc-900/80 font-mono text-xs uppercase tracking-wider transition-colors rounded-none ${
        selected
          ? 'bg-amber-500/10 text-amber-400'
          : 'text-zinc-300 hover:bg-amber-500/10 hover:text-amber-400'
      }`}
      aria-pressed={selected}
    >
      <span>{label}</span>
      {selected && <span className="text-amber-500 font-bold">●</span>}
    </button>
  );
}

export default function PlayerSettingsModal({ title = '[ CONFIGURAÇÕES DO PLAYER ]', onClose, children }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Configurações do player"
      className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 shadow-2xl rounded-none w-full max-w-sm p-0 overflow-hidden"
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    >
      <div className="bg-zinc-900/80 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="font-mono text-xs font-bold text-amber-500 tracking-wider uppercase">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="font-mono text-zinc-400 hover:text-amber-500 text-xs px-2 py-0.5 border border-zinc-800 hover:border-amber-500/50 rounded-none transition-colors"
          aria-label="Fechar configurações"
        >
          [ X ]
        </button>
      </div>

      <div>{children}</div>
    </div>
  );
}
