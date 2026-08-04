import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkWatchlistStatus, toggleWatchlist } from '../utils/watchlist';

const PlusIcon = (props) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
  </svg>
);

const CheckIcon = (props) => (
  <svg {...props} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export default function WatchlistButton({
  userId,
  videoId,
  variant = 'default',
  className = '',
  loginReturnPath = '/casos',
}) {
  const navigate = useNavigate();
  const [inList, setInList] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(Boolean(userId && videoId));

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!userId || !videoId) {
        setInList(false);
        setChecking(false);
        return;
      }

      setChecking(true);
      const status = await checkWatchlistStatus(userId, videoId);
      if (!cancelled) {
        setInList(status);
        setChecking(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [userId, videoId]);

  const handleToggle = useCallback(async (event) => {
    event.stopPropagation();
    event.preventDefault();

    if (!userId) {
      navigate('/login', { state: { from: loginReturnPath } });
      return;
    }

    if (!videoId || loading) return;

    setLoading(true);
    const next = !inList;
    setInList(next);

    const { error } = await toggleWatchlist(userId, videoId, !next);

    if (error) {
      setInList(!next);
    }

    setLoading(false);
  }, [userId, videoId, loading, inList, navigate, loginReturnPath]);

  const isHero = variant === 'hero';
  const isCard = variant === 'card';
  const label = inList ? 'Na Minha Lista' : 'Minha Lista';

  if (isCard) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        onMouseDown={(event) => event.stopPropagation()}
        disabled={checking || loading}
        aria-pressed={inList}
        aria-label={inList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
        className={`rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black disabled:opacity-60 ${
          inList ? 'text-brand-primary' : ''
        } ${className}`}
      >
        {inList ? (
          <CheckIcon className="h-4 w-4 shrink-0" />
        ) : (
          <PlusIcon className="h-4 w-4 shrink-0" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={checking || loading}
      aria-pressed={inList}
      aria-label={inList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
      className={`touch-target inline-flex items-center gap-2 rounded-none border font-mono text-xs uppercase tracking-wider transition-colors disabled:opacity-60 ${
        isHero
          ? inList
            ? 'border-brand-primary/60 bg-brand-primary/10 px-4 py-3 text-brand-primary'
            : 'border-dark-border bg-dark-panel/60 px-4 py-3 text-zinc-300 hover:border-zinc-500 hover:text-white'
          : inList
            ? 'border-brand-primary/60 bg-brand-primary/10 px-3 py-2 text-brand-primary'
            : 'border-dark-border px-3 py-2 text-zinc-300 hover:border-zinc-500 hover:text-white'
      } ${className}`}
    >
      {inList ? (
        <CheckIcon className="h-4 w-4 shrink-0" />
      ) : (
        <PlusIcon className="h-4 w-4 shrink-0" />
      )}
      <span>{label}</span>
    </button>
  );
}
