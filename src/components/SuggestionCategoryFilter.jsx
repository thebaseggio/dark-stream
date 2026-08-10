import React from 'react';
import { SUGGESTION_CATEGORIES } from '../utils/caseSuggestions';

const FILTER_OPTIONS = ['Todos', ...SUGGESTION_CATEGORIES];

export default function SuggestionCategoryFilter({ value = 'Todos', onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`rounded-full px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
            value === option
              ? 'bg-brand-primary text-black font-bold'
              : 'border border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-600 hover:text-white'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function filterSuggestionsByCategory(suggestions, categoryFilter) {
  if (!categoryFilter || categoryFilter === 'Todos') {
    return suggestions;
  }
  return suggestions.filter((item) => item.category === categoryFilter);
}
