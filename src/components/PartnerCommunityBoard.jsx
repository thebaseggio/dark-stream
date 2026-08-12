import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCaseSuggestions } from '../utils/caseSuggestions';
import SuggestionCategoryFilter, { filterSuggestionsByCategory } from './SuggestionCategoryFilter';
import LoadingSpinner from './LoadingSpinner';

function CategoryBadge({ category }) {
  return (
    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
      {category}
    </span>
  );
}

export default function PartnerCommunityBoard({ onUseSuggestion }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  const filteredSuggestions = useMemo(
    () => filterSuggestionsByCategory(suggestions, categoryFilter),
    [suggestions, categoryFilter],
  );

  const loadSuggestions = useCallback(async () => {
    setLoading(true);
    const rows = await fetchCaseSuggestions(30);
    setSuggestions(rows);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleCopyCredit = async (suggestion) => {
    const credit = `Sugestão da comunidade por ${suggestion.user_name} — "${suggestion.title}"`;
    try {
      await navigator.clipboard.writeText(credit);
      setCopiedId(suggestion.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-900/80 overflow-hidden">
      <div className="border-b border-zinc-800 px-5 py-5 sm:px-6">
        <h2 className="font-anton text-xl text-white">Mural da Comunidade</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Ranking das ideias mais votadas nos últimos 30 dias. Use o crédito ao publicar um novo caso.
        </p>
      </div>

      {loading ? (
        <div className="px-6 py-12 flex justify-center">
          <LoadingSpinner size="sm" label="Carregando sugestões…" />
        </div>
      ) : suggestions.length === 0 ? (
        <p className="px-6 py-16 text-center text-sm text-zinc-500">
          Nenhuma sugestão na janela dos últimos 30 dias.
        </p>
      ) : (
        <div>
          <div className="border-b border-zinc-800 px-5 py-4 sm:px-6">
            <SuggestionCategoryFilter value={categoryFilter} onChange={setCategoryFilter} />
          </div>

          {filteredSuggestions.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-zinc-500">
              Nenhuma sugestão em
              {' '}
              <span className="text-zinc-300">{categoryFilter}</span>
              .
            </p>
          ) : (
        <div className="divide-y divide-zinc-800">
          {filteredSuggestions.map((suggestion, index) => (
            <article key={suggestion.id} className="px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs tabular-nums text-brand-primary">
                      #
                      {index + 1}
                    </span>
                    <CategoryBadge category={suggestion.category} />
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                      ▲
                      {' '}
                      {suggestion.upvotes_count || 0}
                      {' '}
                      votos
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{suggestion.title}</h3>
                  <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap">
                    {suggestion.description}
                  </p>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                    Sugerido por
                    {' '}
                    <span className="text-zinc-300">{suggestion.user_name}</span>
                  </p>
                </div>

                <div className="flex flex-shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCredit(suggestion)}
                    className="border border-zinc-700 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
                  >
                    {copiedId === suggestion.id ? 'Copiado!' : 'Copiar crédito'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUseSuggestion?.(suggestion)}
                    className="rounded-lg bg-brand-primary px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-black transition-opacity hover:opacity-90"
                  >
                    Usar no novo caso
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
          )}
        </div>
      )}
    </section>
  );
}
