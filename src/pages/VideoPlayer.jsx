// src/pages/VideoPlayer.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';

export default function VideoPlayer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    // NOVO ESTADO: para controlar se o usuário já clicou em "play"
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        const fetchVideoUrl = async () => {
            if (!id) { setLoading(false); return; }
            const { data, error } = await supabase
                .from('videos')
                .select('videoUrl, title, thumbnail') // Agora também buscamos a thumbnail
                .eq('id', id)
                .single();
            
            if (error || !data) {
                console.error("Vídeo não encontrado:", error);
                navigate('/404');
            } else {
                setVideo(data);
                setLoading(false);
            }
        };
        fetchVideoUrl();
    }, [id, navigate]);

    if (loading) {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Carregando Player...</div>;
    }

    if (!video) {
        return <div className="fixed inset-0 bg-black flex items-center justify-center text-white">Vídeo não encontrado.</div>;
    }

    return (
        // O fundo preto que cobre a tela inteira
        <div className="fixed inset-0 bg-black z-40 flex items-center justify-center p-4">
            <button onClick={() => navigate(-1)} className="absolute top-5 right-5 text-white text-3xl hover:opacity-70 transition-opacity z-50 p-2" title="Voltar">&times;</button>
            
            {/* O container do nosso player, menor e centralizado */}
            <div className="relative w-full max-w-4xl aspect-video rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                {hasStarted ? (
                    // DEPOIS DO CLIQUE: Mostra o vídeo tocando com som
                    <iframe 
                        src={`${video.videoUrl}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`} 
                        title={video.title}
                        className="w-full h-full"
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                    ></iframe>
                ) : (
                    // ANTES DO CLIQUE: Mostra a thumbnail com um botão de play customizado
                    <div onClick={() => setHasStarted(true)} className="relative w-full h-full cursor-pointer group">
                        <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="bg-black/50 rounded-full p-4 transition-all duration-300 group-hover:bg-[#f1c40f] group-hover:scale-110">
                                <svg className="w-12 h-12 text-white group-hover:text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"></path></svg>
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-4 text-white text-shadow">
                            <p className="text-xs">Clique para iniciar</p>
                            <h3 className="font-bold text-lg">{video.title}</h3>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}