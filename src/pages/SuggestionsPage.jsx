import React, { useCallback, useEffect, useState, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import AnimatedPage from '../AnimatedPage';
import SiteContainer from '../components/SiteContainer';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import { useAuth } from '../contexts/AuthProvider';
import DevSubscriptionActivator from '../components/DevSubscriptionActivator';
import SuggestionCategoryFilter, { filterSuggestionsByCategory } from '../components/SuggestionCategoryFilter';
import { hasActiveSubscription } from '../utils/subscriptionAccess';
import {
  SUGGESTION_CATEGORIES,
  createCaseSuggestion,
  fetchCaseSuggestions,
  fetchUserSuggestionVotes,
  voteCaseSuggestion,
} from '../utils/caseSuggestions';

function PaywallBanner() {
  return (
    <div className="rounded-lg border border-brand-primary/30 bg-zinc-900/80 p-6 sm:p-8 text-center">
      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-primary">
        Conteúdo exclusivo
      </p>
      <h2 className="mt-3 font-anton text-2xl text-white">Mural reservado a assinantes</h2>
      <p className="mt-3 max-w-xl mx-auto text-sm text-zinc-400 leading-relaxed">
        Sugira casos, vote nas ideias da comunidade e ajude a definir o próximo mistério do catálogo.
        Ative sua assinatura para participar.
      </p>
      <Link
        to="/plans"
        className="mt-6 inline-flex rounded-lg bg-brand-primary px-6 py-3 font-mono text-xs uppercase tracking-wider text-black transition-opacity hover:opacity-90"
      >
        Ver planos de assinatura
      </Link>
    </div>
  );
}

function CategoryBadge({ category }) {
  return (
    <span className="inline-flex rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-300">
      {category}
    </span>
  );
}

function SuggestionCard({ suggestion, hasVoted, onVote, isVoting }) {
  return (
    <article className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => onVote(suggestion.id)}
          disabled={hasVoted || isVoting}
          className={`flex h-16 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg border font-mono text-xs uppercase tracking-wider transition-colors ${
            hasVoted
              ? 'border-brand-primary/50 bg-brand-primary/10 text-brand-primary'
              : 'border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-brand-primary/40 hover:text-brand-primary'
          } disabled:cursor-default`}
          aria-label={hasVoted ? 'Voto registrado' : 'Votar nesta sugestão'}
        >
          <span className="text-base leading-none">▲</span>
          <span className="mt-1 tabular-nums">{suggestion.upvotes_count || 0}</span>
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={suggestion.category} />
          </div>
          <h3 className="text-lg font-semibold text-white">{suggestion.title}</h3>
          <p className="text-sm leading-relaxed text-zinc-400 whitespace-pre-wrap">
            {suggestion.description}
          </p>
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
            Por
            {' '}
            <span className="text-zinc-300">{suggestion.user_name}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

export default function SuggestionsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const isSubscriber = hasActiveSubscription(profile);

  const [suggestions, setSuggestions] = useState([]);
  const [votedIds, setVotedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votingId, setVotingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: SUGGESTION_CATEGORIES[0],
  });
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  const loadBoard = useCallback(async () => {
    if (!user || !isSubscriber) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [rows, votes] = await Promise.all([
      fetchCaseSuggestions(30),
      fetchUserSuggestionVotes(user.id),
    ]);
    setSuggestions(rows);
    setVotedIds(votes);
    setLoading(false);
  }, [user, isSubscriber]);

  useEffect(() => {
    if (!authLoading) {
      loadBoard();
    }
  }, [authLoading, loadBoard]);

  const handleVote = async (suggestionId) => {
    if (!user || votedIds.has(suggestionId)) return;

    setVotingId(suggestionId);
    const { error } = await voteCaseSuggestion(user.id, suggestionId);

    if (!error) {
      setVotedIds((prev) => new Set(prev).add(suggestionId));
      setSuggestions((prev) => prev.map((item) => (
        item.id === suggestionId
          ? { ...item, upvotes_count: (item.upvotes_count || 0) + 1 }
          : item
      )));
    }

    setVotingId(null);
  };

  const handleSubmitSuggestion = async (event) => {
    event.preventDefault();
    if (!user || !form.title.trim()) return;

    setIsSubmitting(true);

    const userName = profile?.username || user.email?.split('@')[0] || 'Assinante';
    const { data, error } = await createCaseSuggestion(user.id, userName, form);

    if (!error && data) {
      setSuggestions((prev) => [data, ...prev].sort((a, b) => {
        const votesDiff = (b.upvotes_count || 0) - (a.upvotes_count || 0);
        if (votesDiff !== 0) return votesDiff;
        return new Date(b.created_at) - new Date(a.created_at);
      }));
      setForm({ title: '', description: '', category: SUGGESTION_CATEGORIES[0] });
      setIsModalOpen(false);
    }

    setIsSubmitting(false);
  };

  const filteredSuggestions = filterSuggestionsByCategory(suggestions, categoryFilter);

  if (authLoading) {
    return (
      <AnimatedPage>
        <SiteContainer className="py-16 text-center text-zinc-500">Carregando…</SiteContainer>
      </AnimatedPage>
    );
  }

  return (
    <>
      <SeoHead
        title="Mural de Casos da Comunidade | Dark Stream"
        description={DEFAULT_SITE_DESCRIPTION}
      />

      <AnimatedPage>
        <SiteContainer className="py-8 md:py-10">
          <div className="space-y-8">
            <DevSubscriptionActivator autoActivate />

            <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-primary">
                  Comunidade Dark Stream
                </p>
                <h1 className="mt-2 font-anton text-3xl sm:text-4xl text-white tracking-wide">
                  Mural de Casos da Comunidade
                </h1>
                <p className="mt-2 text-sm text-zinc-400">
                  Ranking dos últimos 30 dias — os casos mais votados sobem no topo.
                </p>
              </div>

              {isSubscriber && user && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="touch-target rounded-lg bg-brand-primary px-5 py-3 font-mono text-xs uppercase tracking-wider text-black transition-opacity hover:opacity-90"
                >
                  + Sugerir Caso
                </button>
              )}
            </header>

            {!user ? (
              <PaywallBanner />
            ) : !isSubscriber ? (
              <PaywallBanner />
            ) : loading ? (
              <p className="py-16 text-center text-sm text-zinc-500">Carregando mural…</p>
            ) : suggestions.length === 0 ? (
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 py-16 text-center">
                <p className="text-sm text-zinc-500">Nenhuma sugestão nos últimos 30 dias.</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 font-mono text-xs uppercase tracking-wider text-brand-primary hover:underline"
                >
                  Seja o primeiro a sugerir
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <SuggestionCategoryFilter value={categoryFilter} onChange={setCategoryFilter} />

                {filteredSuggestions.length === 0 ? (
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900/80 py-12 text-center">
                    <p className="text-sm text-zinc-500">
                      Nenhuma sugestão em
                      {' '}
                      <span className="text-zinc-300">{categoryFilter}</span>
                      .
                    </p>
                  </div>
                ) : (
                  filteredSuggestions.map((suggestion) => (
                    <SuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      hasVoted={votedIds.has(suggestion.id)}
                      onVote={handleVote}
                      isVoting={votingId === suggestion.id}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </SiteContainer>
      </AnimatedPage>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isSubmitting && setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
              <Dialog.Panel className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
                <Dialog.Title className="font-anton text-2xl text-white">Sugerir Caso</Dialog.Title>
                <p className="mt-2 text-sm text-zinc-500">
                  Compartilhe uma ideia de mistério para a comunidade votar.
                </p>

                <form onSubmit={handleSubmitSuggestion} className="mt-6 space-y-5">
                  <div>
                    <label htmlFor="suggestion-title" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      Título do Caso
                    </label>
                    <input
                      id="suggestion-title"
                      type="text"
                      required
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-white focus:border-brand-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">
                      Categoria
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {SUGGESTION_CATEGORIES.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, category }))}
                          className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-full transition-colors ${
                            form.category === category
                              ? 'bg-brand-primary text-black font-bold'
                              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="suggestion-description" className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                      Descrição
                    </label>
                    <textarea
                      id="suggestion-description"
                      rows="4"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="mt-2 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900/80 px-4 py-3 text-white focus:border-brand-primary focus:outline-none"
                      placeholder="Por que este caso deveria entrar no catálogo?"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-lg bg-brand-primary py-3 font-mono text-sm uppercase tracking-wider text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enviando…' : 'Publicar sugestão'}
                  </button>
                </form>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
