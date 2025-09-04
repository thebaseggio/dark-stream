// src/pages/CreatorDashboard.jsx

import React, { useState, useEffect, Fragment } from 'react';
import { supabase } from '../supabase';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import DashboardChart from './DashboardChart';
import RecentComments from "../components/RecentComments"; 
import { Dialog, Transition } from '@headlessui/react';
import ProfileEditor from '../components/ProfileEditor';

export default function CreatorDashboard({ user, profile, onUploadClick, onEditClick, onProfileUpdate, onSuccess }) {
    const navigate = useNavigate();
    const [myVideos, setMyVideos] = useState([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);
    const [stats, setStats] = useState({ views: 0, likes: 0, subscribers: 0 });

    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

const fetchMyData = async () => {
    if (!user) return;
    setIsLoadingVideos(true);
    
    // Passo 1: Buscar os vídeos do Parceiro (esta linha estava faltando)
    const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
    
    // Passo 2: Buscar a contagem de inscritos
    const { count, error: subsError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

    // Passo 3: Agora sim, verificar se houve erro em qualquer uma das buscas
    if (videosError || subsError) {
        console.error("Erro ao buscar dados do painel:", videosError || subsError);
    } else {
        // Se deu tudo certo, atualizamos os estados
        setMyVideos(videosData);
        
        const totalViews = videosData.reduce((sum, video) => sum + (video.views || 0), 0);
        const totalLikes = videosData.reduce((sum, video) => sum + (video.likes || 0), 0);

        setStats({ views: totalViews, likes: totalLikes, subscribers: count || 0 });
    }
    setIsLoadingVideos(false);
};

    useEffect(() => {
        fetchMyData();
    }, [user]); // Removido 'refreshTrigger' pois a lógica já atualiza quando necessário

    const handleDelete = async (videoId) => {
        if (window.confirm("Tem certeza que deseja excluir este vídeo?")) {
            const { error } = await supabase.from('videos').delete().eq('id', videoId);
            if (error) {
                alert(`Erro: ${error.message}`);
            } else {
                alert("Vídeo excluído!");
                fetchMyData(); // Garante que TUDO seja atualizado após a exclusão
            }
        }
    };
    
    if (!user) {
        return (
            <AnimatedPage>
                <div className="text-center p-8">
                    <h1 className="text-2xl font-bold">Acesso Negado</h1>
                    <p className="mt-2 text-gray-400">Você precisa estar logado.</p>
                    <button onClick={() => navigate('/login')} className="mt-6 bg-[#f1c40f] text-black font-bold py-2 px-6 rounded-lg">Fazer Login</button>
                </div>
            </AnimatedPage>
        );
    }
    
    

    return (
        <>
            <AnimatedPage>
            <div className="max-w-7xl mx-auto space-y-8">
            <div className="bg-zinc-900 p-6 rounded-lg flex flex-col md:flex-row items-start md:items-center gap-6">

                {/* Bloco de Informações do Parceiro (agora flexível e controlado) */}
                <div className="flex items-center gap-5 flex-1">
                    {/* Avatar com tamanho fixo e um pouco maior */}
                    <button onClick={() => setIsProfileModalOpen(true)} className="relative group/avatar flex-shrink-0" title="Editar foto de perfil">
                        <img 
                            src={profile?.creatorAvatar || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0)}&background=f1c40f&color=000`} 
                            alt={profile?.username}
                            className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700 transition-opacity group-hover/avatar:opacity-70"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                            <span className="text-white text-xs font-bold">Editar</span>
                        </div>
                    </button>

                    {/* Textos com melhor hierarquia e espaçamento */}
                    <div className="flex-1">
                        <p className="text-sm font-bold text-[#f1c40f] tracking-wider">PAINEL DO PARCEIRO</p>
                        <h1 className="text-3xl font-bold text-white mt-1">Olá, {profile?.username || 'Criador'}!</h1>
                        <p className="text-gray-300 text-sm mt-2 max-w-xl">{profile?.bio || 'Bem-vindo(a) ao seu painel.'}</p>
                    </div>
                </div>

                {/* Botão de Upload Aprimorado */}
                <button 
                    onClick={onUploadClick} 
                    title="Fazer Upload de Vídeo" 
                    className="bg-[#f1c40f] text-black font-bold rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 px-4 py-3 self-start md:self-center flex-shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    {/* O texto some em telas muito pequenas para não quebrar o layout */}
                    <span className="hidden sm:inline">Novo Vídeo</span>
                </button>
            </div>

                {/* --- ATUALIZAÇÃO: Cards de Estatísticas agora mostram dados reais --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Total de Vídeos</p>
                        <p className="text-2xl font-bold">{isLoadingVideos ? '...' : myVideos.length}</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Total de Views</p>
                        {/* Mostramos '...' durante o carregamento e depois o valor real */}
                        <p className="text-2xl font-bold">{isLoadingVideos ? '...' : stats.views.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Total de Curtidas</p>
                        <p className="text-2xl font-bold">{isLoadingVideos ? '...' : stats.likes.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="bg-zinc-900 p-4 rounded-lg">
                        <p className="text-sm text-gray-400">Inscritos</p>
                    <p className="text-2xl font-bold">{isLoadingVideos ? '...' : stats.subscribers.toLocaleString('pt-BR')}</p>                    </div>
                </div>
                <DashboardChart userId={user.id} />
                <RecentComments userId={user?.id} />

                <div className="bg-zinc-900 p-4 sm:p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Seu Conteúdo</h2>
                    {isLoadingVideos ? (
                        <p className="text-gray-400 text-center py-4">Carregando seus vídeos...</p>
                    ) : myVideos.length > 0 ? (
                        <div className="overflow-x-auto">
                            {/* --- A MUDANÇA PRINCIPAL ACONTECE AQUI NA TABELA --- */}
                            <table className="w-full text-sm text-left align-middle">
                                <thead className="text-xs text-gray-400 uppercase">
                                    <tr>
                                        {/* Coluna "Título" agora é "Vídeo" para incluir a thumbnail */}
                                        <th className="px-4 py-3">Vídeo</th>
                                        {/* Novas colunas de estatísticas */}
                                        <th className="px-4 py-3 text-center hidden sm:table-cell">Views</th>
                                        <th className="px-4 py-3 text-center hidden sm:table-cell">Curtidas</th>
                                        <th className="px-4 py-3 hidden md:table-cell">Data de Envio</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myVideos.map(video => (
                                        <tr key={video.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                                            {/* Célula do Vídeo com Thumbnail e Título Clicável */}
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-4">
                                                    <img 
                                                        src={video.thumbnail || `https://placehold.co/120x90/000/FFF?text=IMG`} 
                                                        alt={video.title}
                                                        className="w-28 h-16 rounded-md object-cover hidden md:block"
                                                    />
                                                    <div>
                                                        <Link to={`/video/${video.id}`} target="_blank" className="hover:text-[#f1c40f] hover:underline" title="Ver página do vídeo">
                                                            {video.title}
                                                        </Link>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Novas Células de Estatísticas */}
                                            <td className="px-4 py-3 text-center hidden sm:table-cell">{video.views?.toLocaleString('pt-BR') || 0}</td>
                                            <td className="px-4 py-3 text-center hidden sm:table-cell">{video.likes?.toLocaleString('pt-BR') || 0}</td>
                                            <td className="px-4 py-3 hidden md:table-cell">{video.created_at ? new Date(video.created_at).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex gap-4 justify-end">
                                                    <button onClick={() => onEditClick(video)} className="font-medium text-blue-500 hover:underline">Editar</button>
                                                    <button onClick={() => handleDelete(video.id)} className="font-medium text-red-500 hover:underline">Excluir</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        // O "Estado Vazio" continua o mesmo por enquanto
                    <div className="text-center py-16 px-6 bg-zinc-800/50 rounded-lg border-2 border-dashed border-zinc-700">
                            <svg className="mx-auto h-12 w-12 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.55a2 2 0 01.35 3.55l-1.6 1.28A2 2 0 0018 16.5V19a2 2 0 01-2 2H8a2 2 0 01-2-2v-2.5a2 2 0 00-.5-1.67l-1.6-1.28A2 2 0 014.25 10H15zM12 12a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                            <h3 className="mt-2 text-lg font-medium text-white">Nenhum caso para solucionar ainda...</h3>
                            <p className="mt-1 text-sm text-zinc-400">Seu conteúdo aparecerá aqui assim que você fizer o primeiro envio.</p>
                            <div className="mt-6">
                                <button
                                    onClick={onUploadClick} // A mesma função do botão '+'
                                    type="button"
                                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-md shadow-sm text-black bg-[#f1c40f] hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#f1c40f] focus:ring-offset-zinc-900 transition-transform duration-200 hover:scale-105"
                                >
                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Enviar seu primeiro vídeo
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AnimatedPage>
        
            {/* --- NEW: Modal for the Profile Editor --- */}
            <Transition appear show={isProfileModalOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={() => setIsProfileModalOpen(false)}>
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-black/70" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4">
                            <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white mb-6">
                                    Editar Foto de Perfil
                                </Dialog.Title>
                                <ProfileEditor
                                    user={user}
                                    profile={profile}
                                    onUploadSuccess={() => {
                                        setIsProfileModalOpen(false);
                                        onProfileUpdate(); // Avisa o App.jsx para re-buscar o perfil
                                    }}
                                    onSuccess={onSuccess}
                                />
                            </Dialog.Panel>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}