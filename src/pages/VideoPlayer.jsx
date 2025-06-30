// src/pages/VideoPlayer.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from './AnimatedPage';

export default function VideoPlayer() {
    // 1. CAPTURANDO O ID DA URL
    // O hook useParams() pega os parâmetros da rota, no nosso caso o ':id'
    const { id } = useParams();

    // 2. ESTADOS DO COMPONENTE
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 3. BUSCANDO OS DADOS DO VÍDEO
    useEffect(() => {
        const fetchVideo = async () => {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('videos')
                .select('*') // Seleciona todas as colunas
                .eq('id', id)  // Onde o 'id' da tabela seja igual ao 'id' da URL
                .single();   // Esperamos apenas um resultado

            if (error) {
                console.error("Erro ao buscar o vídeo:", error);
                setError("Não foi possível carregar o vídeo.");
            } else {
                setVideo(data);
            }
            setLoading(false);
        };

        if (id) {
            fetchVideo();
        }
    }, [id]); // Este efeito roda sempre que o 'id' da URL mudar

    // 4. RENDERIZAÇÃO CONDICIONAL
    if (loading) {
        return <div className="text-center p-10">Carregando vídeo...</div>;
    }

    if (error || !video) {
        return <div className="text-center p-10">Vídeo não encontrado ou erro ao carregar.</div>;
    }

    return (
        <AnimatedPage>
            <div className="max-w-4xl mx-auto px-4">
                {/* PLAYER DE VÍDEO RESPONSIVO */}
                <div className="aspect-w-16 aspect-h-9 mb-4">
                    <iframe 
                        src={video.videoUrl} 
                        title={video.title} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                        className="w-full h-full rounded-lg shadow-lg"
                    ></iframe>
                </div>

                {/* DETALHES DO VÍDEO */}
                <div className="bg-zinc-900 p-6 rounded-lg">
                    <h1 className="text-3xl font-bold mb-2">{video.title}</h1>
                    
                    <Link to={`/criador/${video.creatorId}`} className="inline-block mb-4">
                        <div className="flex items-center gap-3 group">
                            <img 
                                src={video.creatorAvatar || `https://ui-avatars.com/api/?name=${video.creatorName?.charAt(0)}&background=f1c40f&color=000`} 
                                alt={video.creatorName}
                                className="w-10 h-10 rounded-full object-cover transition-transform duration-200 group-hover:scale-110"
                            />
                            <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                                por <span className="font-bold text-white">{video.creatorName}</span>
                            </p>
                        </div>
                    </Link>
                    
                    <hr className="border-zinc-700 my-4" />

                    <p className="text-gray-400 whitespace-pre-wrap">
                        {video.description}
                    </p>
                </div>
            </div>
        </AnimatedPage>
    );
}