import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import VideoCard from '../components/VideoCard';
import PartnerCorkBoard from '../components/PartnerCorkBoard';
import RestrictedAccessScreen from '../components/RestrictedAccessScreen';
import { useNotification } from '../contexts/NotificationProvider';

const CONTENT_TABS = [
  { id: 'todos', label: 'Todos os Casos' },
  { id: 'populares', label: 'Casos Mais Populares' },
  { id: 'series', label: 'Séries/Avisos' },
];

const FALLBACK_PISTAS = [
  {
    id: 'fallback-1',
    title: 'Novo Episódio',
    content: 'Investigadores: preparem-se. Novo capítulo chegando ao arquivo esta semana.',
    post_type: 'aviso',
    pin_color: 'yellow',
  },
  {
    id: 'fallback-2',
    title: 'Pista de Bastidor',
    content: 'Material inédito gravado durante a investigação será revelado em breve.',
    post_type: 'bastidor',
    pin_color: 'pink',
  },
  {
    id: 'fallback-3',
    title: 'Atualização',
    content: 'Fiquem atentos ao mural — novas evidências serão fixadas aqui primeiro.',
    post_type: 'pista',
    pin_color: 'blue',
  },
];

function formatVideoForCard(video, partnerProfile) {
  return {
    ...video,
    thumbnail_url: video.thumbnail,
    creator_username: partnerProfile.username,
    creator_avatar_url: partnerProfile.creatorAvatar,
    creator_role: partnerProfile.role,
  };
}

function SocialLink({ href, label }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 hover:text-brand-primary border border-dark-border px-3 py-1.5 transition-colors"
    >
      {label}
    </a>
  );
}

export default function PartnerProfile({ currentUser }) {
  const { id: partnerId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [partnerProfile, setPartnerProfile] = useState(null);
  const [partnerVideos, setPartnerVideos] = useState([]);
  const [partnerShorts, setPartnerShorts] = useState([]);
  const [pistas, setPistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!partnerId || !currentUser) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', partnerId)
        .single();

      if (profileError || !profileData) {
        console.error('Erro ao buscar perfil do parceiro:', profileError);
        setLoading(false);
        return;
      }

      setPartnerProfile(profileData);
      const creatorId = String(profileData.id);

      const [videosRes, pistasRes, subsCountRes, userSubRes] = await Promise.all([
        supabase
          .from('videos')
          .select('*')
          .eq('creator_id', creatorId)
          .order('created_at', { ascending: false }),
        supabase
          .from('partner_pistas')
          .select('*')
          .eq('partner_id', creatorId)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creatorId),
        supabase
          .from('subscriptions')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('follower_id', currentUser.id)
          .maybeSingle(),
      ]);

      if (videosRes.error) {
        console.error('Erro ao buscar vídeos do parceiro:', videosRes.error);
        setPartnerVideos([]);
        setPartnerShorts([]);
      } else {
        const allVideos = videosRes.data || [];
        const regularVideos = allVideos.filter((video) => video.is_short !== true);
        const shorts = allVideos.filter((video) => video.is_short === true);

        setPartnerVideos(regularVideos.map((v) => formatVideoForCard(v, profileData)));
        setPartnerShorts(shorts.map((v) => formatVideoForCard(v, profileData)));
      }

      if (pistasRes.error) {
        console.error('Erro ao buscar pistas:', pistasRes.error);
        setPistas(FALLBACK_PISTAS);
      } else {
        setPistas(pistasRes.data?.length ? pistasRes.data : FALLBACK_PISTAS);
      }

      if (!subsCountRes.error) setSubscriberCount(subsCountRes.count || 0);
      if (!userSubRes.error) setIsSubscribed(!!userSubRes.data);

      setLoading(false);
    };

    fetchPartnerData();
  }, [partnerId, currentUser]);

  const displayedVideos = useMemo(() => {
    if (activeTab === 'populares') {
      return [...partnerVideos].sort((a, b) => (b.views || 0) - (a.views || 0));
    }
    if (activeTab === 'series') {
      return partnerShorts;
    }
    return partnerVideos;
  }, [activeTab, partnerVideos, partnerShorts]);

  const seriesNotices = useMemo(() => {
    return pistas.filter((p) => p.post_type === 'aviso' || p.post_type === 'bastidor');
  }, [pistas]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/parceiro/${partnerId}` } });
      return;
    }
    if (currentUser.id === partnerId) return;

    setIsProcessingFollow(true);

    if (isSubscribed) {
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .match({ creator_id: String(partnerProfile?.id || partnerId), follower_id: currentUser.id });

      if (!error) {
        setIsSubscribed(false);
        setSubscriberCount((prev) => prev - 1);
        showNotification('success', `Você deixou de seguir ${partnerProfile.username}.`);
      } else {
        showNotification('error', `Erro: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from('subscriptions')
        .insert({ creator_id: String(partnerProfile?.id || partnerId), follower_id: currentUser.id });

      if (!error) {
        setIsSubscribed(true);
        setSubscriberCount((prev) => prev + 1);
        showNotification('success', `Agora você está seguindo ${partnerProfile.username}!`);
      } else {
        showNotification('error', `Erro: ${error.message}`);
      }
    }

    setIsProcessingFollow(false);
  };

  if (!currentUser) {
    return (
      <AnimatedPage className="h-full">
        <RestrictedAccessScreen
          caseId={partnerId}
          variant="partner"
          loginState={{ from: `/parceiro/${partnerId}` }}
        />
      </AnimatedPage>
    );
  }

  if (loading) {
    return (
      <AnimatedPage>
        <div className="bg-dark-pure min-h-[50vh] flex items-center justify-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Carregando QG...</p>
        </div>
      </AnimatedPage>
    );
  }

  if (!partnerProfile) {
    return (
      <AnimatedPage>
        <div className="bg-dark-pure min-h-[50vh] flex items-center justify-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Parceiro não encontrado.</p>
        </div>
      </AnimatedPage>
    );
  }

  const avatarUrl = partnerProfile.creatorAvatar
    || `https://ui-avatars.com/api/?name=${partnerProfile.username?.charAt(0)}&background=111111&color=fff`;

  const bannerUrl = partnerProfile.banner_url;

  return (
    <AnimatedPage>
      <div className="bg-dark-pure text-white font-sans min-h-screen">
        <section className="relative h-48 sm:h-56 lg:h-64 overflow-hidden border-b border-dark-border">
          {bannerUrl ? (
            <img src={bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1208 35%, #0d0d0d 70%, #000 100%)',
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-pure via-dark-pure/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-dark-pure/80 via-transparent to-dark-pure/80" />

          <div className="relative z-10 max-w-6xl mx-auto px-6 h-full flex items-end pb-6 gap-5">
            <img
              src={avatarUrl}
              alt={partnerProfile.username}
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover border-2 border-dark-border shadow-2xl shadow-black/60 flex-shrink-0 -mb-2"
            />
            <div className="min-w-0 flex-1 pb-1">
              <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-brand-primary/80">QG do Parceiro</p>
              <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white truncate">
                {partnerProfile.username}
              </h1>
              <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-1">
                {subscriberCount.toLocaleString('pt-BR')} seguidores
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <SocialLink href={partnerProfile.youtube_url} label="YouTube" />
                <SocialLink href={partnerProfile.instagram_url} label="Instagram" />
                <SocialLink href={partnerProfile.x_url} label="X / Twitter" />
              </div>
            </div>

            {currentUser?.id !== partnerId && (
              <button
                type="button"
                onClick={handleFollowToggle}
                disabled={isProcessingFollow}
                className="flex-shrink-0 self-end mb-1 border border-dark-border bg-dark-panel/80 text-white px-4 py-2 text-xs uppercase tracking-wider hover:bg-dark-border transition-colors disabled:opacity-50"
              >
                {isProcessingFollow ? '...' : isSubscribed ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-6 py-10">
          {partnerProfile.bio && (
            <section className="border border-dark-border bg-dark-panel p-5 mb-8">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-2">Dossiê</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{partnerProfile.bio}</p>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="flex flex-wrap gap-2 border-b border-dark-border pb-4">
                {CONTENT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`text-[10px] font-mono uppercase tracking-wider px-4 py-2 border transition-colors ${
                      activeTab === tab.id
                        ? 'border-brand-primary text-brand-primary bg-brand-primary/10'
                        : 'border-dark-border text-zinc-500 hover:text-white hover:border-zinc-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'series' && seriesNotices.length > 0 && (
                <div className="space-y-3 border border-dark-border bg-dark-panel p-4">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Avisos do QG</p>
                  {seriesNotices.map((notice) => (
                    <div key={notice.id} className="border-l-2 border-brand-primary/50 pl-3 py-1">
                      {notice.title && (
                        <p className="text-xs font-mono uppercase tracking-wider text-zinc-300">{notice.title}</p>
                      )}
                      <p className="text-sm text-zinc-400 mt-0.5">{notice.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {displayedVideos.length > 0 ? (
                <div className={`grid gap-6 ${activeTab === 'series' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-3'}`}>
                  {displayedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      variant={activeTab === 'series' ? 'short' : 'default'}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm font-mono text-zinc-600 py-8 text-center uppercase tracking-wider">
                  {activeTab === 'series' ? 'Nenhuma série ou aviso publicado ainda.' : 'Nenhum caso publicado ainda.'}
                </p>
              )}
            </div>

            <div className="lg:col-span-4">
              <PartnerCorkBoard pistas={pistas} partnerName={partnerProfile.username} />
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
