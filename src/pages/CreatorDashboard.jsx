// src/pages/CreatorDashboard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import DashboardChart from './DashboardChart';

export default function CreatorDashboard({ user, profile, onUploadClick, onEditClick, refreshTrigger }) { 
    const navigate = useNavigate();
    const [myVideos, setMyVideos] = useState([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);

    const [stats, setStats] = useState({ views: 0, likes: 0 });

    const fetchMyVideos = async () => {
        if (!user) return;
        setIsLoadingVideos(true);
        const { data, error } = await supabase.from('videos').select('*').eq('creator_id', user.id).order('created_at', { ascending: false });
        
        if (error) {
            console.error("Erro ao buscar vídeos:", error);
        } else {
            setMyVideos(data);
            
            // --- CORREÇÃO 2: Faltava a lógica para calcular os totais ---
            // Assumindo que sua tabela 'videos' tem colunas 'views' e 'likes'
            const totalViews = data.reduce((sum, video) => sum + (video.views || 0), 0);
            const totalLikes = data.reduce((sum, video) => sum + (video.likes || 0), 0);

            // Atualiza o estado com os totais calculados
            setStats({ views: totalViews, likes: totalLikes });
        }
        setIsLoadingVideos(false);
    };

    useEffect(() => {
        fetchMyVideos();
        }, [user, refreshTrigger]); 

    const handleDelete = async (videoId) => {
        if (window.confirm("Tem certeza que deseja excluir este vídeo?")) {
            const { error } = await supabase.from('videos').delete().eq('id', videoId);
            if (error) alert(`Erro: ${error.message}`);
            else {
                alert("Vídeo excluído!");
                fetchMyVideos();
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
        <AnimatedPage>
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <img 
                            src={profile?.creatorAvatar || `https://ui-avatars.com/api/?name=${profile?.username?.charAt(0)}&background=f1c40f&color=000`} 
                            alt={profile?.username}
                            className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700"
                        />
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">Olá, {profile?.username || 'Criador'}!</h1>
                            <p className="text-sm text-gray-400">{profile?.bio || 'Bem-vindo(a) ao seu painel.'}</p>
                        </div>
                    </div>
                    <button onClick={onUploadClick} title="Fazer Upload de Vídeo" className="bg-[#f1c40f] text-black font-bold rounded-lg hover:bg-opacity-90 transition-all duration-200 hover:scale-105 flex items-center justify-center w-12 h-12">
                        <span className="text-3xl pb-1">+</span>
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
                        <p className="text-2xl font-bold">Em breve</p>
                    </div>
                </div>
                <DashboardChart />

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
    );
}