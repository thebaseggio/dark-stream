// src/pages/CreatorDashboard.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';

export default function CreatorDashboard({ user, profile, onUploadClick, onEditClick }) {
    const navigate = useNavigate();
    const [myVideos, setMyVideos] = useState([]);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);

    const fetchMyVideos = async () => {
        if (!user) return;
        setIsLoadingVideos(true);
        const { data, error } = await supabase.from('videos').select('*').eq('creatorId', user.id).order('created_at', { ascending: false });
        if (error) console.error("Erro ao buscar vídeos:", error);
        else setMyVideos(data);
        setIsLoadingVideos(false);
    };

    useEffect(() => {
        fetchMyVideos();
    }, [user]);

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
                    <button onClick={onUploadClick} className="bg-[#f1c40f] text-black font-bold py-2 px-5 rounded-lg hover:bg-opacity-90 transition-transform duration-200 hover:scale-105 w-full md:w-auto">
                        Fazer Upload de Vídeo
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-zinc-900 p-4 rounded-lg"><p className="text-sm text-gray-400">Total de Vídeos</p><p className="text-2xl font-bold">{myVideos.length}</p></div>
                    <div className="bg-zinc-900 p-4 rounded-lg"><p className="text-sm text-gray-400">Total de Views</p><p className="text-2xl font-bold">Em breve</p></div>
                    <div className="bg-zinc-900 p-4 rounded-lg"><p className="text-sm text-gray-400">Total de Curtidas</p><p className="text-2xl font-bold">Em breve</p></div>
                    <div className="bg-zinc-900 p-4 rounded-lg"><p className="text-sm text-gray-400">Inscritos</p><p className="text-2xl font-bold">Em breve</p></div>
                </div>

                <div className="bg-zinc-900 p-4 sm:p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Seu Conteúdo</h2>
                    {isLoadingVideos ? (
                        <p className="text-gray-400 text-center py-4">Carregando seus vídeos...</p>
                    ) : myVideos.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-400 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Título</th>
                                        <th className="px-4 py-3 hidden md:table-cell">Categoria</th>
                                        <th className="px-4 py-3 hidden sm:table-cell">Data de Envio</th>
                                        <th className="px-4 py-3 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myVideos.map(video => (
                                        <tr key={video.id} className="border-t border-zinc-800">
                                            <td className="px-4 py-3 font-medium">{video.title}</td>
                                            <td className="px-4 py-3 hidden md:table-cell">{video.category}</td>
                                            <td className="px-4 py-3 hidden sm:table-cell">{video.created_at ? new Date(video.created_at).toLocaleDateString() : 'N/A'}</td>
                                            <td className="px-4 py-3 flex gap-4 justify-end">
                                                <button onClick={() => onEditClick(video)} className="font-medium text-blue-500 hover:underline">Editar</button>
                                                <button onClick={() => handleDelete(video.id)} className="font-medium text-red-500 hover:underline">Excluir</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-400">Você ainda não enviou nenhum vídeo.</p>
                            <p className="text-gray-500 text-sm mt-1">Clique em "Fazer Upload" para começar a compartilhar suas histórias.</p>
                        </div>
                    )}
                </div>
            </div>
        </AnimatedPage>
    );
}