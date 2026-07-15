import React from 'react';
import { OpsPanel } from './OpsPanel';

const RANK_SEGMENTS = [
  { key: 'recruta', label: 'Espectadores Novos', color: 'bg-neutral-600' },
  { key: 'agente', label: 'Espectadores Regulares', color: 'bg-neutral-400' },
  { key: 'elite', label: 'Espectadores Fiéis', color: 'bg-[#eab308]' },
];

export default function PatentDistribution({ distribution = {}, loading }) {
  const total = RANK_SEGMENTS.reduce((sum, seg) => sum + (distribution[seg.key] || 0), 0) || 1;

  return (
    <OpsPanel title="Engajamento da Audiência">
      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Calculando engajamento...</p>
      ) : (
        <div className="space-y-6">
          <div className="flex h-2 w-full overflow-hidden bg-neutral-800">
            {RANK_SEGMENTS.map((seg) => {
              const value = distribution[seg.key] || 0;
              const width = (value / total) * 100;
              if (width <= 0) return null;
              return (
                <div
                  key={seg.key}
                  className={`h-full ${seg.color}`}
                  style={{ width: `${width}%` }}
                  title={`${seg.label}: ${value}`}
                />
              );
            })}
          </div>

          <div className="space-y-4">
            {RANK_SEGMENTS.map((seg) => {
              const value = distribution[seg.key] || 0;
              const pct = Math.round((value / total) * 100);
              return (
                <div key={seg.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-400">{seg.label}</span>
                    <span className="text-white tabular-nums">
                      {pct}%
                      <span className="text-neutral-500 ml-1">({value})</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-neutral-800">
                    <div className={`h-full ${seg.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-neutral-500 text-center pt-2">
            Base: {total} espectadores únicos no canal
          </p>
        </div>
      )}
    </OpsPanel>
  );
}
