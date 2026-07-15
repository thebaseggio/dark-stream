import React from 'react';
import { Link } from 'react-router-dom';
import { OpsPanel } from './OpsPanel';

export default function FieldStatusList({ cases = [], loading }) {
  return (
    <OpsPanel title="Performance por Vídeo">
      {loading ? (
        <p className="text-sm text-neutral-400 py-8 text-center">Carregando desempenho...</p>
      ) : cases.length === 0 ? (
        <p className="text-sm text-neutral-400 py-8 text-center">
          Nenhum vídeo com dados no período.
        </p>
      ) : (
        <div className="space-y-3">
          {cases.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 border border-neutral-800 bg-black/40 px-4 py-3"
            >
              <span className="text-sm text-neutral-500 w-6 tabular-nums flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/video/${item.id}`}
                  className="text-sm text-white hover:text-[#eab308] truncate block transition-colors"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-neutral-400 mt-1">
                  {item.inquiries} views · {item.theories} comentários · {item.supports} curtidas
                </p>
              </div>
              <span
                className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 border flex-shrink-0 ${
                  item.status === 'hot'
                    ? 'border-[#eab308]/40 text-[#eab308] bg-[#eab308]/10'
                    : 'border-neutral-700 text-neutral-400 bg-neutral-900'
                }`}
              >
                {item.status === 'hot' ? 'Alto' : 'Baixo'}
              </span>
            </div>
          ))}
        </div>
      )}
    </OpsPanel>
  );
}
