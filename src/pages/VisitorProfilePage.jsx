import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import ProfileEditor from '../components/ProfileEditor';
import { supabase } from '../supabase';
import VideoCard from '../components/VideoCard';
import { getPartnerProfilePath } from '../utils/partnerProfile';
import { fetchFollowingPartners } from '../utils/subscriptions';

const ProfileSection = ({ title, children }) => (
  <div className="bg-zinc-900 p-6 rounded-lg">
    <h2 className="text-xl font-bold mb-4 text-[#f1c40f]">{title}</h2>
    {children}
  </div>
);

function FollowingPartnerCard({ partner, onNavigate }) {
  const avatarUrl =
    partner.creatorAvatar
    || partner.avatar_url
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.username?.charAt(0) || 'P')}&background=27272a&color=f1c40f&bold=true`;

  return (
    <button
      type="button"
      onClick={() => onNavigate(getPartnerProfilePath(partner) || `/parceiro/${partner.id}`)}
      className="group flex items-center gap-4 w-full text-left border border-neutral-800 bg-[#121212] hover:border-[#eab308]/40 transition-all duration-300 p-4"
    >
      <img
        src={avatarUrl}
        alt={partner.username}
        className="w-14 h-14 rounded-full object-cover border border-neutral-800 flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate group-hover:text-[#f1c40f] transition-colors">
          {partner.username}
        </p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 mt-1">
          Canal do parceiro
        </p>
      </div>
      <span className="text-neutral-600 group-hover:text-[#eab308] transition-colors" aria-hidden="true">
        →
      </span>
    </button>
  );
}

export default function VisitorProfilePage({ user, profile, onProfileUpdate, onSuccess }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(true);
  const [activeTab, setActiveTab] = useState('seguindo');
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchDataForTab = async () => {
      if (!user) return;

      if (activeTab === 'seguindo') {
        setIsLoadingFollowing(true);

        try {
          const partners = await fetchFollowingPartners(supabase, user.id);
          setFollowing(partners);
        } catch {
          setFollowing([]);
        } finally {
          setIsLoadingFollowing(false);
        }
      } else if (activeTab === 'historico') {
        if (history.length > 0) {
          setIsLoadingHistory(false);
          return;
        }

        setIsLoadingHistory(true);

        const { data, error } = await supabase
          .from('views')
          .select('created_at, video:videos (*, creator:profiles(id, username, creatorAvatar))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Erro ao buscar histórico:', error);
        } else {
          setHistory(data.map((view) => view.video));
        }
        setIsLoadingHistory(false);
      }
    };

    fetchDataForTab();
  }, [user, activeTab, history.length]);

  if (!user || !profile) {
    return (
      <AnimatedPage>
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="mt-2 text-gray-400">Você precisa estar logado para ver seu perfil.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 bg-[#f1c40f] text-black font-bold py-2 px-6 rounded-lg"
          >
            Fazer Login
          </button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-6 p-4">
          <img
            src={profile?.creatorAvatar || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0)}&background=f1c40f&color=000`}
            alt={profile?.username}
            className="w-24 h-24 rounded-full object-cover border-2 border-zinc-700"
          />
          <div>
            <h1 className="text-3xl font-bold">Olá, {profile?.username || 'Visitante'}!</h1>
            <p className="text-gray-400">Bem-vindo(a) ao seu espaço no Dark Stream.</p>
          </div>
        </div>

        <ProfileSection title="Informações da Conta">
          <p className="text-gray-300 mb-4">
            Aqui você pode atualizar suas informações básicas, como nome de usuário, bio e avatar.
          </p>
          <ProfileEditor
            user={user}
            profile={profile}
            onUploadSuccess={onProfileUpdate}
            onSuccess={onSuccess}
          />
        </ProfileSection>

        <ProfileSection title="Minha Atividade">
          <div className="flex border-b border-zinc-700 mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('seguindo')}
              className={`py-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'seguindo' ? 'text-white border-b-2 border-[#f1c40f]' : 'text-gray-400 hover:text-white'}`}
            >
              Seguindo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historico')}
              className={`py-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'historico' ? 'text-white border-b-2 border-[#f1c40f]' : 'text-gray-400 hover:text-white'}`}
            >
              Histórico
            </button>
          </div>

          <div>
            {activeTab === 'seguindo' && (
              isLoadingFollowing ? (
                <p className="text-gray-400">Carregando parceiros seguidos...</p>
              ) : following.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {following.map((partner) => (
                    <FollowingPartnerCard
                      key={partner.id}
                      partner={partner}
                      onNavigate={navigate}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Você ainda não segue nenhum parceiro.</p>
              )
            )}

            {activeTab === 'historico' && (
              isLoadingHistory ? (
                <p className="text-gray-400">Carregando histórico...</p>
              ) : history.length > 0 ? (
                <div className="space-y-4">
                  {history.map((video) => (
                    video && <VideoCard key={video.id} video={video} orientation="horizontal" />
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">Seu histórico de vídeos assistidos aparecerá aqui.</p>
              )
            )}
          </div>
        </ProfileSection>
      </div>
    </AnimatedPage>
  );
}
