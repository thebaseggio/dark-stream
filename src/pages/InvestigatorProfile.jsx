import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import {
  countUniqueCases,
  getInvestigatorRank,
  mergeSolvedCases,
} from '../utils/investigatorRank';

function SolvedCaseCard({ item }) {
  const video = item.video;
  const thumbnail = video.thumbnail || video.thumbnail_url;

  return (
    <Link
      to={`/video/${video.id}`}
      className="group relative border border-dark-border bg-dark-panel overflow-hidden hover:border-zinc-600 transition-colors"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute top-2 right-2 rotate-[-12deg] border-2 border-green-700/80 bg-green-950/70 px-2 py-1">
          <p className="text-[8px] font-mono font-bold uppercase tracking-widest text-green-400">
            Caso Solucionado
          </p>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h3 className="text-[11px] font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 group-hover:text-brand-primary transition-colors">
          {video.title}
        </h3>
        <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
          {item.sources.includes('recomendado') ? 'Recomendado' : 'Assistido'}
          {item.sources.length > 1 ? ' · Recomendado' : ''}
        </p>
      </div>
    </Link>
  );
}

export default function InvestigatorProfile({ user, profile }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rankData, setRankData] = useState(null);
  const [solvedCases, setSolvedCases] = useState([]);
  const [joinDate, setJoinDate] = useState(null);

  useEffect(() => {
    const fetchInvestigatorData = async () => {
      if (!user?.id) return;
      setLoading(true);

      const [viewsRes, likesRes] = await Promise.all([
        supabase
          .from('views')
          .select('created_at, video_id, video:videos(id, title, thumbnail, created_at)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_feedback')
          .select('created_at, video_id, video:videos(id, title, thumbnail, created_at)')
          .eq('user_id', user.id)
          .eq('rating', 'like')
          .order('created_at', { ascending: false }),
      ]);

      if (viewsRes.error) console.error('Erro ao buscar visualizações:', viewsRes.error);
      if (likesRes.error) console.error('Erro ao buscar feedbacks:', likesRes.error);

      const allVideoIds = [
        ...(viewsRes.data || []).map((v) => v.video_id),
        ...(likesRes.data || []).map((l) => l.video_id),
      ];

      const caseCount = countUniqueCases(allVideoIds);
      const rank = getInvestigatorRank(caseCount);
      const solved = mergeSolvedCases(viewsRes.data || [], likesRes.data || []);

      setRankData(rank);
      setSolvedCases(solved);
      setJoinDate(user.created_at || profile?.created_at || null);
      setLoading(false);
    };

    fetchInvestigatorData();
  }, [user?.id, user?.created_at, profile?.created_at]);

  const avatarUrl = profile?.creatorAvatar
    || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0) || 'I'}&background=111111&color=f1c40f&bold=true`;

  const formattedJoinDate = joinDate
    ? new Date(joinDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Data não registrada';

  const badgeId = user?.id?.slice(0, 8).toUpperCase() || '--------';

  if (loading) {
    return (
      <AnimatedPage>
        <div className="min-h-[60vh] bg-dark-pure flex items-center justify-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
            Carregando crachá...
          </p>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="bg-dark-pure text-white font-sans min-h-screen py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <header className="text-center space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-zinc-600">
              Departamento de Investigação — Dark Stream
            </p>
            <h1 className="font-anton text-3xl sm:text-4xl text-white">Perfil de Investigador</h1>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
            <aside className={`border-2 ${rankData?.accent || 'border-dark-border'} bg-dark-panel p-6 space-y-5 shadow-2xl shadow-black/50`}>
              <div className="border-b border-dark-border pb-4 text-center">
                <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-brand-primary">
                  Crachá Oficial
                </p>
                <p className="text-[10px] font-mono text-zinc-600 mt-1">ID #{badgeId}</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-28 h-32 border-2 border-dark-border bg-black overflow-hidden">
                  <img src={avatarUrl} alt={profile?.username} className="w-full h-full object-cover" />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-white text-center">
                  {profile?.username || 'Investigador'}
                </h2>
                <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 mt-1 text-center">
                  Ingresso: {formattedJoinDate}
                </p>
              </div>

              <div className={`text-center py-3 border border-dark-border ${rankData?.badge || ''}`}>
                <p className="text-[10px] font-mono uppercase tracking-widest opacity-80">Patente</p>
                <p className="text-base font-mono font-bold uppercase tracking-wider mt-1">
                  {rankData?.emoji} {rankData?.title}
                </p>
                <p className="text-[10px] font-mono mt-1 opacity-70">
                  {rankData?.caseCount} {rankData?.caseCount === 1 ? 'caso' : 'casos'} registrados
                </p>
              </div>

              {rankData?.progressToNext && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] font-mono uppercase tracking-wider text-zinc-500">
                    <span>Progresso</span>
                    <span>{rankData.progressToNext.current}/{rankData.progressToNext.target}</span>
                  </div>
                  <div className="h-1.5 bg-black border border-dark-border">
                    <div
                      className="h-full bg-brand-primary transition-all"
                      style={{
                        width: `${Math.min(100, (rankData.progressToNext.current / rankData.progressToNext.target) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider text-center">
                    Próxima: {rankData.progressToNext.nextTitle}
                  </p>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={() => navigate('/meu-perfil')}
                  className="w-full rounded-none border border-dark-border text-zinc-300 font-mono uppercase tracking-wider text-[10px] px-4 py-2.5 hover:bg-dark-border transition-colors"
                >
                  Editar Credenciais
                </button>
                <Link
                  to="/casos"
                  className="block w-full text-center rounded-none bg-brand-primary text-black font-mono uppercase tracking-wider text-[10px] px-4 py-2.5 hover:opacity-90 transition-opacity"
                >
                  Voltar ao Arquivo
                </Link>
              </div>
            </aside>

            <section className="space-y-6">
              <div className="border border-dark-border bg-dark-panel p-5 sm:p-6">
                <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 mb-4">
                  Estatísticas de Campo
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="border border-dark-border p-4 text-center">
                    <p className="text-2xl font-mono font-bold text-white">{rankData?.caseCount || 0}</p>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 mt-1">Casos</p>
                  </div>
                  <div className="border border-dark-border p-4 text-center">
                    <p className="text-2xl font-mono font-bold text-white">{solvedCases.length}</p>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 mt-1">Solucionados</p>
                  </div>
                  <div className="border border-dark-border p-4 text-center col-span-2 sm:col-span-1">
                    <p className="text-2xl font-mono font-bold text-white">{rankData?.emoji}</p>
                    <p className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 mt-1">Patente Atual</p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500">
                    Casos Solucionados
                  </h3>
                  <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
                    {solvedCases.length} registros
                  </p>
                </div>

                {solvedCases.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {solvedCases.map((item) => (
                      <SolvedCaseCard key={item.video.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-dark-border p-10 text-center">
                    <p className="text-sm font-mono text-zinc-500 uppercase tracking-wider">
                      Nenhum caso solucionado ainda.
                    </p>
                    <p className="text-xs text-zinc-600 mt-2">
                      Assista casos ou recomende conteúdo para subir de patente.
                    </p>
                    <Link
                      to="/casos"
                      className="inline-block mt-4 text-[10px] font-mono uppercase tracking-wider text-brand-primary hover:underline"
                    >
                      Explorar casos →
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
