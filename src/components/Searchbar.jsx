// src/components/Searchbar.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { getPartnerProfilePath } from '../utils/partnerProfile';
import { getPartnerAvatarUrl, searchQuickResults } from '../utils/searchCatalog';
import LoadingSpinner from './LoadingSpinner';

const SearchIcon = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
    <path
      fillRule="evenodd"
      d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Searchbar({ immersive = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({ videos: [], partners: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const containerRef = useRef(null);
  const mobilePanelRef = useRef(null);
  const mobileInputRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  const trimmedQuery = searchQuery.trim();
  const showPanel = isOpen && trimmedQuery.length > 2;

  const runSearch = useCallback(async (term) => {
    setIsLoading(true);

    try {
      const data = await searchQuickResults(supabase, term);
      setResults({
        videos: Array.isArray(data?.videos) ? data.videos : [],
        partners: Array.isArray(data?.partners) ? data.partners : [],
      });
    } catch (error) {
      console.error('Erro ao buscar no Searchbar:', error);
      setResults({ videos: [], partners: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (trimmedQuery.length <= 2) {
      setResults({ videos: [], partners: [] });
      setIsLoading(false);
      return undefined;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      runSearch(trimmedQuery);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [trimmedQuery, runSearch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inDesktop = containerRef.current?.contains(event.target);
      const inMobile = mobilePanelRef.current?.contains(event.target);
      if (!inDesktop && !inMobile) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mobileExpanded) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') setMobileExpanded(false);
    };

    document.addEventListener('keydown', handleEscape);
    mobileInputRef.current?.focus();

    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileExpanded]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trimmedQuery) return;
    setIsOpen(false);
    setMobileExpanded(false);
    navigate(`/busca?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setMobileExpanded(false);
    setSearchQuery('');
    setResults({ videos: [], partners: [] });
  };

  const videoResults = Array.isArray(results?.videos) ? results.videos : [];
  const partnerResults = Array.isArray(results?.partners) ? results.partners : [];
  const hasResults = videoResults.length > 0 || partnerResults.length > 0;
  const inputClassName =
    'box-border h-10 max-h-10 min-h-0 w-full rounded-none border border-zinc-800 bg-black/80 px-3 py-0 pr-10 font-mono text-xs leading-none text-zinc-200 outline-none transition-colors placeholder:font-mono placeholder:text-zinc-600 focus:border-amber-500 md:text-sm';

  const renderResultsPanel = (className = '') => (
    showPanel && (
      <div
        className={`absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-none border border-zinc-800 bg-black/95 shadow-2xl shadow-black/50 ${className}`}
      >
        {isLoading ? (
          <div className="px-4 py-4">
            <LoadingSpinner size="sm" label="Buscando..." inline />
          </div>
        ) : !hasResults ? (
          <p className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Nenhum resultado encontrado.
          </p>
        ) : (
          <div className="py-2">
            {videoResults.length > 0 && (
              <section>
                <p className="border-b border-dark-border px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Casos
                </p>
                <ul>
                  {videoResults.map((video) => (
                    <li key={video.id}>
                      <Link
                        to={`/video/${video.id}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-dark-border/40"
                      >
                        {video.thumbnail ? (
                          <img
                            src={video.thumbnail}
                            alt=""
                            className="h-7 w-12 flex-shrink-0 border border-dark-border object-cover"
                          />
                        ) : (
                          <div className="h-7 w-12 flex-shrink-0 border border-dark-border bg-dark-pure" />
                        )}
                        <span className="line-clamp-2 text-xs font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:text-brand-primary">
                          {video.title}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {partnerResults.length > 0 && (
              <section className={videoResults.length > 0 ? 'border-t border-dark-border' : ''}>
                <p className="border-b border-dark-border px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                  Parceiros
                </p>
                <ul>
                  {partnerResults.map((creator) => (
                    <li key={creator.id}>
                      <Link
                        to={getPartnerProfilePath(creator) || `/parceiro/${creator.id}`}
                        onClick={handleResultClick}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-dark-border/40"
                      >
                        <img
                          src={getPartnerAvatarUrl(creator)}
                          alt=""
                          className="h-8 w-8 flex-shrink-0 border border-dark-border object-cover"
                        />
                        <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 transition-colors hover:text-brand-primary">
                          {creator.username}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    )
  );

  const renderSearchForm = (inputRef) => (
    <form onSubmit={handleSubmit} className="relative box-border h-10 min-w-0 flex-1">
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Buscar vídeos, parceiros..."
        className={inputClassName}
        autoComplete="off"
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 flex h-10 items-center pr-3 text-zinc-500 transition-colors hover:text-amber-500"
        aria-label="Buscar"
      >
        <SearchIcon className="h-4 w-4" />
      </button>
    </form>
  );

  return (
    <>
      <div ref={containerRef} className="relative box-border hidden h-10 min-w-0 md:flex md:w-56 md:items-stretch lg:w-64">
        {renderSearchForm(null)}
        {renderResultsPanel()}
      </div>

      <button
        type="button"
        onClick={() => setMobileExpanded(true)}
        className="box-border flex h-10 w-10 min-h-0 max-h-10 cursor-pointer items-center justify-center rounded-none border border-zinc-800 bg-black/80 py-0 text-zinc-400 transition-colors hover:border-zinc-600 hover:text-amber-500 md:hidden"
        aria-label="Abrir busca"
      >
        <SearchIcon className="h-5 w-5" />
      </button>

      {mobileExpanded && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[55] bg-black/60 md:hidden"
            aria-label="Fechar busca"
            onClick={() => setMobileExpanded(false)}
          />
          <div
            ref={mobilePanelRef}
            className="fixed inset-x-0 top-0 z-[60] border-b border-dark-border bg-black/95 px-4 py-3 md:hidden"
          >
            <div className="flex h-10 items-stretch gap-2">
              <div className="relative box-border h-10 min-w-0 flex-1">
                {renderSearchForm(mobileInputRef)}
                {renderResultsPanel('mt-1')}
              </div>
              <button
                type="button"
                onClick={() => setMobileExpanded(false)}
                className="box-border flex h-10 min-h-0 max-h-10 flex-shrink-0 cursor-pointer items-center justify-center rounded-none border border-zinc-800 bg-black/80 px-3 py-0 font-mono text-xs uppercase leading-none tracking-wider text-zinc-400 transition-colors hover:border-zinc-600 hover:text-white"
                aria-label="Fechar busca"
              >
                ✕
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
