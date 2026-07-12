import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import VideoCard from '../components/VideoCard';
import { useNotification } from '../contexts/NotificationProvider';

function formatVideoForCard(video, partnerProfile) {
  return {
    ...video,
    thumbnail_url: video.thumbnail,
    creator_username: partnerProfile.username,
    creator_avatar_url: partnerProfile.creatorAvatar,
    creator_role: partnerProfile.role,
  };
}

export default function PartnerProfile({ currentUser }) {
  const { id: partnerId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [partnerProfile, setPartnerProfile] = useState(null);
  const [partnerVideos, setPartnerVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);

  useEffect(() => {
    const fetchPartnerData = async () => {
      if (!partnerId) return;
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

      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Erro ao buscar vídeos do parceiro:', videosError);
        setPartnerVideos([]);
      } else {
        const regularVideos = (videosData || []).filter((video) => video.is_short !== true);
        setPartnerVideos(
          regularVideos.map((video) => formatVideoForCard(video, profileData))
        );
      }

      const { count, error: countError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId);

      if (!countError) setSubscriberCount(count || 0);

      if (currentUser) {
        const { data: subData, error: subError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('follower_id', currentUser.id)
          .maybeSingle();

        if (!subError) setIsSubscribed(!!subData);
      }

      setLoading(false);
    };

    fetchPartnerData();
  }, [partnerId, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      showNotification('info', 'Você precisa estar logado para seguir um parceiro.');
      navigate('/login');
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

  if (loading) {
    return (
      <AnimatedPage>
        <div className="bg-dark-pure min-h-[50vh] flex items-center justify-center">
          <p className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">Carregando parceiro...</p>
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

  return (
    <AnimatedPage>
      <div className="bg-dark-pure text-white font-sans min-h-screen">
        <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">

          <header className="border border-dark-border bg-dark-panel p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center justify-between">
            <div className="flex items-center gap-5 min-w-0">
              <img
                src={avatarUrl}
                alt={partnerProfile.username}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover border border-dark-border flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">Parceiro</p>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mt-1 truncate">
                  {partnerProfile.username}
                </h1>
                <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 mt-2">
                  {subscriberCount.toLocaleString('pt-BR')} seguidores
                </p>
              </div>
            </div>

            {currentUser?.id !== partnerId && (
              <button
                onClick={handleFollowToggle}
                disabled={isProcessingFollow}
                className="flex-shrink-0 border border-dark-border text-white px-3 py-1 text-xs uppercase tracking-wider hover:bg-dark-border transition-colors disabled:opacity-50"
              >
                {isProcessingFollow ? '...' : isSubscribed ? 'Seguindo' : 'Seguir'}
              </button>
            )}
          </header>

          {partnerProfile.bio && (
            <section className="border border-dark-border bg-dark-panel p-6">
              <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3">Sobre</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{partnerProfile.bio}</p>
            </section>
          )}

          <section>
            <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-6">Casos publicados</p>
            {partnerVideos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {partnerVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <p className="text-sm font-mono text-zinc-600">Nenhum caso publicado ainda.</p>
            )}
          </section>

        </div>
      </div>
    </AnimatedPage>
  );
}
