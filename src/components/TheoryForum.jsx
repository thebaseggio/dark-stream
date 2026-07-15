import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import {
  countUniqueCases,
  getInvestigatorRank,
} from '../utils/investigatorRank';

const ACCENT = '#eab308';

function formatTheoryDate(timestamp) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getInitials(username) {
  if (!username) return '??';
  const parts = username.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return username.slice(0, 2).toUpperCase();
}

async function fetchUserCaseCount(userId) {
  if (!userId) return 0;

  const [viewsRes, likesRes] = await Promise.all([
    supabase.from('views').select('video_id').eq('user_id', userId),
    supabase
      .from('user_feedback')
      .select('video_id')
      .eq('user_id', userId)
      .eq('rating', 'like'),
  ]);

  const ids = [
    ...(viewsRes.data || []).map((v) => v.video_id),
    ...(likesRes.data || []).map((l) => l.video_id),
  ];

  return countUniqueCases(ids);
}

function TheoryCard({ theory, author, rank, isOwn, onDelete, isDeleting }) {
  const avatarUrl = author?.creatorAvatar
    || `https://ui-avatars.com/api/?name=${getInitials(author?.username)}&background=111111&color=eab308&bold=true`;

  return (
    <article className="border border-dark-border bg-black/50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <img
          src={avatarUrl}
          alt=""
          className="w-9 h-9 object-cover border border-dark-border flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
              {author?.username || 'Investigador'}
            </span>
            <span
              className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 border"
              style={{ borderColor: `${ACCENT}55`, color: ACCENT }}
            >
              {rank?.emoji} {rank?.title || 'Investigador'}
            </span>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider mt-0.5">
            {formatTheoryDate(theory.created_at)}
          </p>
        </div>
        {isOwn && (
          <button
            type="button"
            onClick={() => onDelete(theory.id)}
            disabled={isDeleting}
            className="text-[9px] font-mono uppercase tracking-wider text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-50"
          >
            Excluir
          </button>
        )}
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
        {theory.content}
      </p>
    </article>
  );
}

export default function TheoryForum({ videoId, user }) {
  const [theories, setTheories] = useState([]);
  const [authors, setAuthors] = useState({});
  const [authorRanks, setAuthorRanks] = useState({});
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [error, setError] = useState(null);

  const loadTheories = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('case_theories')
      .select('*')
      .eq('video_id', String(videoId))
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Erro ao buscar teorias:', fetchError);
      setError('Falha ao carregar o arquivo de teorias.');
      setTheories([]);
      setLoading(false);
      return;
    }

    const rows = data || [];
    setTheories(rows);

    const userIds = [...new Set(rows.map((row) => row.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, creatorAvatar')
        .in('id', userIds);

      const profileMap = {};
      (profiles || []).forEach((profile) => {
        profileMap[profile.id] = profile;
      });
      setAuthors(profileMap);

      const rankEntries = await Promise.all(
        userIds.map(async (uid) => {
          const caseCount = await fetchUserCaseCount(uid);
          return [uid, getInvestigatorRank(caseCount)];
        })
      );
      setAuthorRanks(Object.fromEntries(rankEntries));
    } else {
      setAuthors({});
      setAuthorRanks({});
    }

    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    loadTheories();
  }, [loadTheories]);

  useEffect(() => {
    const loadCurrentRank = async () => {
      if (!user?.id) {
        setCurrentUserRank(null);
        return;
      }
      const caseCount = await fetchUserCaseCount(user.id);
      setCurrentUserRank(getInvestigatorRank(caseCount));
    };

    loadCurrentRank();
  }, [user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id || !content.trim() || submitting) return;

    setSubmitting(true);
    setError(null);

    const { error: insertError } = await supabase.from('case_theories').insert({
      video_id: String(videoId),
      user_id: user.id,
      content: content.trim(),
    });

    if (insertError) {
      console.error('Erro ao enviar teoria:', insertError);
      setError('Não foi possível registrar a teoria. Tente novamente.');
    } else {
      setContent('');
      await loadTheories();
    }

    setSubmitting(false);
  };

  const handleDelete = async (theoryId) => {
    if (!user?.id || deletingId) return;

    setDeletingId(theoryId);
    const { error: deleteError } = await supabase
      .from('case_theories')
      .delete()
      .eq('id', theoryId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Erro ao excluir teoria:', deleteError);
      setError('Não foi possível excluir a teoria.');
    } else {
      setTheories((prev) => prev.filter((t) => t.id !== theoryId));
    }

    setDeletingId(null);
  };

  return (
    <section className="flex-shrink-0 border-t border-dark-border bg-dark-panel/80">
      <div className="px-4 sm:px-6 py-6 space-y-5">
        <header className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
            Terminal de Investigação
          </p>
          <h2 className="text-lg font-mono uppercase tracking-wider text-white">
            Fórum de Teorias
          </h2>
          <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
            Arquivo colaborativo — teorias registradas por investigadores
          </p>
        </header>

        {user ? (
          <form onSubmit={handleSubmit} className="space-y-3 border border-dark-border bg-black/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Nova entrada de campo
              </p>
              {currentUserRank && (
                <span
                  className="text-[9px] font-mono uppercase tracking-wider px-2 py-1 border"
                  style={{ borderColor: `${ACCENT}55`, color: ACCENT }}
                >
                  {currentUserRank.emoji} {currentUserRank.title}
                </span>
              )}
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="> Digite sua teoria sobre o caso..."
              rows={4}
              maxLength={2000}
              className="w-full bg-black border border-dark-border text-zinc-200 placeholder-zinc-700 font-mono text-sm p-3 focus:outline-none focus:border-[#eab308] resize-y min-h-[100px]"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
                {content.length}/2000 caracteres
              </p>
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="rounded-none font-mono uppercase tracking-wider text-[11px] px-5 py-2.5 text-black transition-opacity disabled:opacity-40"
                style={{ backgroundColor: ACCENT }}
              >
                {submitting ? 'Registrando...' : 'Enviar Teoria'}
              </button>
            </div>
          </form>
        ) : (
          <div className="border border-dashed border-dark-border bg-black/40 p-5 text-center space-y-3">
            <p className="text-xs font-mono text-zinc-400 leading-relaxed uppercase tracking-wider">
              Acesso restrito. Autentique suas credenciais (Login) para enviar teorias e discutir o caso.
            </p>
            <Link
              to="/login"
              state={{ from: `/video/${videoId}` }}
              className="inline-block font-mono uppercase tracking-wider text-[11px] px-5 py-2.5 text-black"
              style={{ backgroundColor: ACCENT }}
            >
              Autenticar Credenciais
            </Link>
          </div>
        )}

        {error && (
          <p className="text-[11px] font-mono text-red-400 uppercase tracking-wider">{error}</p>
        )}

        <div className="space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            Teorias registradas ({theories.length})
          </p>

          {loading ? (
            <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider py-6 text-center">
              Carregando arquivo...
            </p>
          ) : theories.length === 0 ? (
            <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-wider py-6 text-center border border-dashed border-dark-border">
              Nenhuma teoria registrada ainda. Seja o primeiro investigador a analisar o caso.
            </p>
          ) : (
            <div className="space-y-3">
              {theories.map((theory) => (
                <TheoryCard
                  key={theory.id}
                  theory={theory}
                  author={authors[theory.user_id]}
                  rank={authorRanks[theory.user_id]}
                  isOwn={user?.id === theory.user_id}
                  onDelete={handleDelete}
                  isDeleting={deletingId === theory.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
