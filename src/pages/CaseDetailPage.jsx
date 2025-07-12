// src/pages/CaseDetailPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';

export default function CaseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideo = async () => {
            if (!id) return;
            setLoading(true);
            const { data, error } = await supabase
                .from('videos')
                .select('*, creatorId ( id, username, creatorAvatar )')
                .eq('id', id)
                .single();
            
            if (error) console.error("Erro ao buscar detalhes do caso:", error);
            else setVideo(data);

            setLoading(false);
        };
        fetchVideo();
    }, [id]);

    if (loading) return <div className="text-center p-10">Carregando detalhes do caso...</div>;
    if (!video) return <div className="text-center p-10">Caso não encontrado.</div>;

    return (
        <AnimatedPage>
            <div className="max-w-4xl mx-auto">
                <div className="bg-zinc-900 rounded-lg shadow-2xl overflow-hidden">
                    <img src={video.thumbnail} alt={video.title} className="w-full h-auto object-cover" />
                    <div className="p-6 md:p-8">
                        <p className="text-sm text-[#f1c40f] font-bold uppercase">{video.category}</p>
                        <h1 className="text-3xl md:text-4xl font-bold my-3">{video.title}</h1>
                        
                        {video.creatorId && (
                        <Link to={`/parceiro/${video.creatorId.id}`} className="inline-block mb-4">
                            <div className="flex items-center gap-3 group">
                                <img src={video.creatorId.creatorAvatar || `https://ui-avatars.com/api/?name=${video.creatorId.username?.charAt(0)}`} alt={video.creatorId.username} className="w-10 h-10 rounded-full object-cover transition-transform duration-200 group-hover:scale-110"/>
                                <p className="text-sm text-gray-300 group-hover:text-white">por <span className="font-bold text-white">{video.creatorId.username}</span></p>
                            </div>
                        </Link>
)}

                        <hr className="border-zinc-700 my-4" />

                        <h3 className="font-bold text-lg mb-2">Descrição do Caso</h3>
                        <p className="text-gray-400 whitespace-pre-wrap leading-relaxed">{video.description}</p>
                        
                        <div className="mt-6 text-xs text-gray-400">
                            <strong>Tags:</strong> {video.tags ? (Array.isArray(video.tags) ? video.tags.join(', ') : video.tags) : 'Nenhuma'}
                        </div>

                        <div className="mt-8 text-center">
                            <button 
                                onClick={() => navigate(`/video/${video.id}`)}
                                className="bg-[#8e44ad] hover:bg-[#803d9c] text-white font-bold py-3 px-10 rounded-lg text-lg transition-transform duration-200 hover:scale-105"
                            >
                                🎬 Entrar na Sala de Cinema
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
}