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
    const [stats, setStats] = useState({ views: 0, subscribers: 0, super_likes: 0, likes: 0, dislikes: 0 });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const fetchMyData = async () => {
        if (!user) return;
        setIsLoadingVideos(true);
        
        const { data: videosData, error: videosError } = await supabase
            .from('videos')
            .select('*')
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false });

        const { count: subsCount, error: subsError } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', user.id);

        if (videosError || subsError) {
            console.error("Erro ao buscar dados do painel:", videosError || subsError);
            setIsLoadingVideos(false);
            return;
        }
        
        setMyVideos(videosData);
        const videoIds = videosData.map(v => v.id);
        let ratingsCount = { super_likes: 0, likes: 0, dislikes: 0 };

        if (videoIds.length > 0) {
            const { data: ratingsData, error: ratingsError } = await supabase
                .from('ratings')
                .select('rating_value')
                .in('video_id', videoIds);

            if (ratingsError) {
                console.error("Erro ao buscar avaliações:", ratingsError);
            } else {
                ratingsCount = ratingsData.reduce((acc, rating) => {
                    if (rating.rating_value === 2) acc.super_likes += 1;
                    if (rating.rating_value === 1) acc.likes += 1;
                    if (rating.rating_value === -1) acc.dislikes += 1;
                    return acc;
                }, { super_likes: 0, likes: 0, dislikes: 0 });
            }
        }
        
        const totalViews = videosData.reduce((sum, video) => sum + (video.views || 0), 0);
        
        setStats({
            views: totalViews,
            subscribers: subsCount || 0,
            ...ratingsCount
        });

        setIsLoadingVideos(false);
    };

    useEffect(() => {
        fetchMyData();
    }, [user]);

    const handleDelete = async (videoId) => {
        if (window.confirm("Tem certeza que deseja excluir este vídeo? Esta ação não pode ser desfeita.")) {
            const { error } = await supabase.from('videos').delete().eq('id', videoId);
            if (error) {
                onSuccess('error', `Erro: ${error.message}`);
            } else {
                onSuccess('success', "Vídeo excluído com sucesso!");
                fetchMyData();
            }
        }
    };
    
    if (!user) {
        return ( <AnimatedPage><div className="text-center p-8"><h1 className="text-2xl font-bold">Acesso Negado</h1><p className="mt-2">Você precisa estar logado.</p></div></AnimatedPage> );
    }
    
    return (
        <>
            <AnimatedPage>
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Cabeçalho do Perfil */}
                    <div className="bg-zinc-900 p-6 sm:p-8 rounded-lg grid grid-cols-12 items-center gap-y-6 md:gap-x-6">
                        <div className="col-span-12 md:col-span-2 flex justify-center">
                            <button onClick={() => setIsProfileModalOpen(true)} className="relative group/avatar flex-shrink-0" title="Editar perfil">
                                <img src={profile?.creatorAvatar || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0)}&background=f1c40f&color=000`} alt={profile?.username} className="w-24 h-24 rounded-full object-cover border-4 border-zinc-700/50 transition-all duration-300 group-hover/avatar:border-[#f1c40f] shadow-lg shadow-black/30"/>
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"><span className="text-white text-xs font-bold">Editar</span></div>
                            </button>
                        </div>
                        <div className="col-span-12 md:col-span-7 text-center md:text-left">
                            <p className="text-sm font-bold text-[#f1c40f] tracking-wider">PAINEL DO PARCEIRO</p>
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <h1 className="text-3xl lg:text-4xl font-bold text-white mt-1">Olá, {profile?.username || 'Criador'}!</h1>
                                <button onClick={() => setIsProfileModalOpen(true)} title="Editar nome e descrição" className="text-zinc-400 hover:text-white transition-colors mt-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>
                                </button>
                            </div>
                            <p className="text-gray-300 text-sm mt-3 leading-relaxed">{profile?.bio || 'Bem-vindo(a) ao seu painel.'}</p>
                        </div>
                        <div className="col-span-12 md:col-span-3 flex justify-center md:justify-end">
                            <button onClick={onUploadClick} title="Fazer Upload de Vídeo" className="bg-[#f1c40f] text-black font-bold rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2 px-5 py-3 w-full md:w-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                <span className="hidden sm:inline">Novo Vídeo</span>
                            </button>
                        </div>
                    </div>
                
                    {/* --- PAINEL DE ESTATÍSTICAS REFINADO --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-zinc-900 p-6 rounded-lg">
                            <p className="text-sm font-medium text-gray-400">Total de Vídeos</p>
                            <p className="text-3xl font-bold mt-1">{isLoadingVideos ? '...' : myVideos.length}</p>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-lg">
                            <p className="text-sm font-medium text-gray-400">Total de Views</p>
                            <p className="text-3xl font-bold mt-1">{isLoadingVideos ? '...' : stats.views.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-lg">
                            <p className="text-sm font-medium text-gray-400">Inscritos</p>
                            <p className="text-3xl font-bold mt-1">{isLoadingVideos ? '...' : stats.subscribers.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-lg">
                            <p className="text-sm font-medium text-gray-400">Gostei Muito</p>
                            <p className="text-3xl font-bold mt-1 flex items-center gap-2">
                                <span className="text-red-400">❤️</span>
                                <span>{isLoadingVideos ? '...' : stats.super_likes.toLocaleString('pt-BR')}</span>
                            </p>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-lg">
                            <p className="text-sm font-medium text-gray-400">Gostei</p>
                            <p className="text-3xl font-bold mt-1 flex items-center gap-2">
                                <span className="text-yellow-400">👍</span>
                                <span>{isLoadingVideos ? '...' : stats.likes.toLocaleString('pt-BR')}</span>
                            </p>
                        </div>
                        <div className="bg-zinc-900 p-6 rounded-lg">
                            <p className="text-sm font-medium text-gray-400">Não Gostei</p>
                            <p className="text-3xl font-bold mt-1 flex items-center gap-2">
                                <span className="text-gray-500">👎</span>
                                <span>{isLoadingVideos ? '...' : stats.dislikes.toLocaleString('pt-BR')}</span>
                            </p>
                        </div>
                    </div>

                    {/* Seção para o Gráfico */}
                    <div className="pt-6 border-t border-zinc-800">
                        <DashboardChart userId={user.id} />
                    </div>

                    {/* Seção para os Comentários */}
                    <div className="pt-6 border-t border-zinc-800">
                        <RecentComments userId={user?.id} />
                    </div>

                    {/* Seção para o Conteúdo */}
                    <div className="pt-6 border-t border-zinc-800 bg-zinc-900 p-6 rounded-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Seu Conteúdo</h2>
                        {isLoadingVideos ? (
                            <p className="text-gray-400 text-center py-4">Carregando seus vídeos...</p>
                        ) : myVideos.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left align-middle">
                                    <thead className="text-xs text-gray-400 uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Vídeo</th>
                                            <th className="px-4 py-3 text-center hidden sm:table-cell">Views</th>
                                            <th className="px-4 py-3 hidden md:table-cell">Data de Envio</th>
                                            <th className="px-4 py-3 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myVideos.map(video => (
                                            <tr key={video.id} className="border-t border-zinc-800 hover:bg-zinc-800/50">
                                                <td className="px-4 py-3 font-medium">
                                                 <div className="flex items-center gap-4">
                                                        <img src={video.thumbnail || `...`} alt={video.title} className="w-28 h-16 rounded-md object-cover hidden md:block" />
                                                        <div>
                                                            <Link to={`/video/${video.id}`} target="_blank" className="hover:text-[#f1c40f] hover:underline" title="Ver página do vídeo">{video.title}</Link>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center hidden sm:table-cell">{video.views?.toLocaleString('pt-BR') || 0}</td>
                                                <td className="px-4 py-3 hidden md:table-cell">{new Date(video.created_at).toLocaleDateString()}</td>
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
                        <div className="text-center py-16 px-6">
                            <h3 className="text-lg font-medium text-white">Nenhum caso para solucionar ainda...</h3>
                            <p className="mt-1 text-sm text-zinc-400">Seu conteúdo aparecerá aqui assim que você fizer o primeiro envio.</p>
                        </div>
                    )}
                </div>
            </div>
        </AnimatedPage>
        
        {/* Modal de Edição de Perfil */}
        <Transition appear show={isProfileModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsProfileModalOpen(false)}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"><div className="fixed inset-0 bg-black/70" /></Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">
                            <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white mb-6">Editar Perfil</Dialog.Title>
                            <ProfileEditor user={user} profile={profile} onSuccess={onSuccess} onUploadSuccess={() => { setIsProfileModalOpen(false); onProfileUpdate(); }} />
                        </Dialog.Panel>
                    </div>
                </div>
            </Dialog>
        </Transition>
    </>
);
}