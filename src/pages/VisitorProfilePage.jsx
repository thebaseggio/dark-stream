// src/pages/VisitorProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import ProfileEditor from '../components/ProfileEditor';
import { supabase } from '../supabase';
import VideoCard from '../components/VideoCard';

// Componente simples para seções futuras
const ProfileSection = ({ title, children }) => (
  <div className="bg-zinc-900 p-6 rounded-lg">
    <h2 className="text-xl font-bold mb-4 text-[#f1c40f]">{title}</h2>
    {children}
  </div>
);

export default function VisitorProfilePage({ user, profile, onProfileUpdate, onSuccess }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState([]); // <-- ADICIONE ESTE ESTADO
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(true); // <-- ESTADO DE LOADING
  const [activeTab, setActiveTab] = useState('seguindo'); 
  const [history, setHistory] = useState([]); // <-- ADICIONE ESTE
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

useEffect(() => {
    const fetchDataForTab = async () => {
        if (!user) return;

        if (activeTab === 'seguindo') {
            if (following.length > 0) return; // Opcional: não busca de novo se já tiver os dados
            setIsLoadingFollowing(true);

            const { data: subscriptions, error: subsError } = await supabase
                .from('subscriptions')
                .select('creator_id')
                .eq('follower_id', user.id);

            if (subsError) {
                console.error("Erro ao buscar inscrições:", subsError);
                setIsLoadingFollowing(false);
                return;
            }

            const creatorIds = subscriptions.map(sub => sub.creator_id);
            if (creatorIds.length > 0) {
                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, username, creatorAvatar')
                    .in('id', creatorIds);

                if (profilesError) {
                    console.error("Erro ao buscar perfis:", profilesError);
                } else {
                    setFollowing(profiles);
                }
            }
            setIsLoadingFollowing(false);

        } else if (activeTab === 'historico') {
            if (history.length > 0) return; // Opcional: não busca de novo se já tiver os dados
            setIsLoadingHistory(true);

            const { data, error } = await supabase
                .from('views')
                .select(`created_at, video:videos (*, creator:profiles(id, username, creatorAvatar))`)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error("Erro ao buscar histórico:", error);
            } else {
                setHistory(data.map(view => view.video));
            }
            setIsLoadingHistory(false);
        }
    };

    fetchDataForTab();
}, [user, activeTab, following.length, history.length]);

  // Se por algum motivo o usuário não estiver logado, mostramos uma mensagem de acesso negado.
  if (!user || !profile) {
    return (
      <AnimatedPage>
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="mt-2 text-gray-400">Você precisa estar logado para ver seu perfil.</p>
          <button onClick={() => navigate('/login')} className="mt-6 bg-[#f1c40f] text-black font-bold py-2 px-6 rounded-lg">Fazer Login</button>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Seção de Boas-vindas e Edição de Perfil */}
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

        {/* Seção para Editar Perfil */}
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
    {/* --- CONTROLES DAS ABAS --- */}
    <div className="flex border-b border-zinc-700 mb-4">
        <button 
            onClick={() => setActiveTab('seguindo')}
            className={`py-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'seguindo' ? 'text-white border-b-2 border-[#f1c40f]' : 'text-gray-400 hover:text-white'}`}
        >
            Seguindo
        </button>
        <button 
            onClick={() => setActiveTab('historico')}
            className={`py-2 px-4 text-sm font-semibold transition-colors ${activeTab === 'historico' ? 'text-white border-b-2 border-[#f1c40f]' : 'text-gray-400 hover:text-white'}`}
        >
            Histórico
        </button>
        {/* Você pode adicionar mais botões de abas aqui no futuro */}
    </div>

    {/* --- CONTEÚDO DAS ABAS --- */}
    <div>
        {/* Conteúdo da Aba "Seguindo" */}
        {activeTab === 'seguindo' && (
            isLoadingFollowing ? (
                <p className="text-gray-400">Carregando...</p>
            ) : following.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {following.map(partner => (
                        <div 
                            key={partner.id} 
                            onClick={() => navigate(`/parceiro/${partner.id}`)}
                            className="flex flex-col items-center text-center gap-2 cursor-pointer group"
                        >
                            <img 
                                src={partner.creatorAvatar || `https://ui-avatars.com/api/?name=${partner.username.charAt(0)}&background=27272a&color=f1c40f&bold=true`}
                                alt={partner.username}
                                className="w-24 h-24 rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <p className="text-sm font-semibold text-white group-hover:text-[#f1c40f]">{partner.username}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-gray-400">Você ainda não segue nenhum Parceiro.</p>
            )
        )}

        {/* Conteúdo da Aba "Histórico" (Placeholder) */}
{activeTab === 'historico' && (
    isLoadingHistory ? (
        <p className="text-gray-400">Carregando histórico...</p>
    ) : history.length > 0 ? (
        <div className="space-y-4">
            {history.map(video => (
                video && <VideoCard key={video.id} video={video} orientation="horizontal"/>
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