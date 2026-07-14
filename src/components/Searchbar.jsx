// src/components/Searchbar.jsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

function escapeIlike(term) {
  return term.replace(/[%_\\]/g, '\\$&');
}

function mergeVideosById(...lists) {
  const map = new Map();
  lists.flat().forEach((video) => {
    if (video?.id) map.set(video.id, video);
  });
  return Array.from(map.values());
}

function videoMatchesTags(video, term) {
  if (!Array.isArray(video?.tags)) return false;
  const lower = term.toLowerCase();
  return video.tags.some((tag) => tag.toLowerCase().includes(lower));
}

export default function Searchbar({ immersive = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState({ videos: [], creators: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  const trimmedQuery = searchQuery.trim();
  const showPanel = isOpen && trimmedQuery.length > 2;

  const runSearch = useCallback(async (term) => {
    const pattern = `%${escapeIlike(term)}%`;

    setIsLoading(true);

    const [videosRes, tagPoolRes, creatorsRes] = await Promise.all([
      supabase
        .from('videos')
        .select('id, title, thumbnail, tags, is_short')
        .or(`title.ilike.${pattern},description.ilike.${pattern}`)
        .order('created_at', { ascending: false })
        .limit(12),
      supabase
        .from('videos')
        .select('id, title, thumbnail, tags, is_short')
        .not('tags', 'eq', '{}')
        .order('created_at', { ascending: false })
        .limit(80),
      supabase
        .from('profiles')
        .select('id, username, creatorAvatar, role')
        .ilike('username', pattern)
        .order('username', { ascending: true })
        .limit(8),
    ]);

    const titleDescMatches = (videosRes.data || []).filter((video) => video.is_short !== true);
    const tagMatches = (tagPoolRes.data || []).filter(
      (video) => video.is_short !== true && videoMatchesTags(video, term)
    );

    if (videosRes.error) console.error('Erro ao buscar casos:', videosRes.error);
    if (tagPoolRes.error) console.error('Erro ao buscar tags:', tagPoolRes.error);
    if (creatorsRes.error) console.error('Erro ao buscar parceiros:', creatorsRes.error);

    setResults({
      videos: mergeVideosById(titleDescMatches, tagMatches).slice(0, 8),
      creators: creatorsRes.data || [],
    });
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (trimmedQuery.length <= 2) {
      setResults({ videos: [], creators: [] });
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
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!trimmedQuery) return;
    setIsOpen(false);
    navigate(`/busca?q=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleResultClick = () => {
    setIsOpen(false);
    setSearchQuery('');
    setResults({ videos: [], creators: [] });
  };

  const hasResults = results.videos.length > 0 || results.creators.length > 0;
  const inputClassName = immersive
    ? 'w-full rounded-none bg-dark-panel/60 border border-dark-border text-zinc-200 placeholder-zinc-600 py-2 pl-4 pr-10 focus:outline-none focus:border-brand-primary transition-colors text-sm'
    : 'w-full rounded-none bg-dark-panel border border-dark-border text-white placeholder-zinc-500 py-2 pl-4 pr-10 focus:outline-none focus:border-brand-primary transition-colors text-sm';

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <form onSubmit={handleSubmit} className="relative">
        <input
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
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-brand-primary transition-colors"
          aria-label="Buscar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </button>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-none border border-dark-border bg-dark-panel shadow-2xl shadow-black/50 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            <p className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Buscando...
            </p>
          ) : !hasResults ? (
            <p className="px-4 py-3 text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              Nenhum resultado encontrado.
            </p>
          ) : (
            <div className="py-2">
              {results.videos.length > 0 && (
                <section>
                  <p className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-dark-border">
                    Casos
                  </p>
                  <ul>
                    {results.videos.map((video) => (
                      <li key={video.id}>
                        <Link
                          to={`/video/${video.id}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-border/40 transition-colors"
                        >
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt=""
                              className="w-12 h-7 object-cover border border-dark-border flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-7 bg-dark-pure border border-dark-border flex-shrink-0" />
                          )}
                          <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 hover:text-brand-primary transition-colors">
                            {video.title}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results.creators.length > 0 && (
                <section className={results.videos.length > 0 ? 'border-t border-dark-border' : ''}>
                  <p className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 border-b border-dark-border">
                    Parceiros
                  </p>
                  <ul>
                    {results.creators.map((creator) => (
                      <li key={creator.id}>
                        <Link
                          to={`/parceiro/${creator.id}`}
                          onClick={handleResultClick}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-dark-border/40 transition-colors"
                        >
                          <img
                            src={
                              creator.creatorAvatar
                              || `https://ui-avatars.com/api/?name=${creator.username?.charAt(0)}&background=111111&color=fff`
                            }
                            alt=""
                            className="w-8 h-8 object-cover border border-dark-border flex-shrink-0"
                          />
                          <span className="text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-brand-primary transition-colors">
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
      )}
    </div>
  );
}
