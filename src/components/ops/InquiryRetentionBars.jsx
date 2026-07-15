import React from 'react';
import { OpsPanel } from './OpsPanel';

export default function InquiryRetentionBars({ data = [], loading }) {
  const maxValue = Math.max(...data.map((d) => Math.max(d.started, d.completed)), 1);

  return (
    <OpsPanel title="Retenção de Público">
      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Carregando dados...</p>
      ) : data.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">
          Sem visualizações registradas no período.
        </p>
      ) : (
        <div className="space-y-6">
          {data.map((item) => (
            <div key={item.id} className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-white truncate flex-1">{item.title}</p>
                <span className="text-xs font-mono text-[#eab308] flex-shrink-0 tabular-nums">
                  {item.completionRate}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 w-24">Visualizações</span>
                  <div className="flex-1 h-1.5 bg-neutral-800">
                    <div
                      className="h-full bg-neutral-500"
                      style={{ width: `${(item.started / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-white w-10 text-right tabular-nums">{item.started}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-400 w-24">Engajamento</span>
                  <div className="flex-1 h-1.5 bg-neutral-800">
                    <div
                      className="h-full bg-[#eab308]"
                      style={{ width: `${(item.completed / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-white w-10 text-right tabular-nums">{item.completed}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </OpsPanel>
  );
}
