// src/pages/Explore.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import PageTransition from '../components/PageTransition';
import SkeletonCard from './SkeletonCard';

const categories = [ 'Nacionais', 'Internacionais', 'Não solucionados', 'Solucionados', 'Serial Killers', 'Documentários', 'Sobrenaturais'];

// Em src/pages/Explore.jsx

function VideoCard({ video, onNavigate }) {
    const creator = video.creator_id; 
    const videoPath = `/video/${video.id}`;
    
    return (
        <div onClick={() => onNavigate(videoPath)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col h-full group cursor-pointer transition-all duration-300 hover:border-[#f1c40f]/50 hover:shadow-lg hover:shadow-[#f1c40f]/10">
            {/* Bloco da Imagem */}
            <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-md">
                <img 
                src={video.thumbnail || `https://placehold.co/480x360/111/FFF?text=IMG`} 
                alt={video.title} 
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
            </div>

            {/* --- NOVA ESTRUTURA PARA O CONTEÚDO --- */}
            {/* Este div vai crescer e empurrar as informações do Parceiro para o final */}
            <div className="flex flex-col flex-grow">
                {/* O título agora tem espaço para crescer */}
            <h2 className="font-bold text-base text-white uppercase leading-snug group-hover:text-[#f1c40f] transition-colors">
                {video.title}
            </h2>
                
                {/* Este div vazio com flex-grow atua como um espaçador mágico */}
                <div className="flex-grow"></div> 

                {/* Bloco do Parceiro, sempre alinhado na base */}
                {creator && (
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
                        <Link 
                            to={`/parceiro/${creator.id}`} 
                            onClick={(e) => e.stopPropagation()} 
                            className="flex items-center gap-2 group/creator"
                        >
                            <img src={creator.creatorAvatar || `https://ui-avatars.com/api/?name=${creator.username.charAt(0)}&background=f1c40f&color=000`} alt={creator.username} className="w-6 h-6 rounded-full object-cover"/>
                            <p className="text-xs text-gray-400 group-hover/creator:text-white transition-colors">{creator.username}</p>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Explore() { // Não recebe mais a prop 'videos'
    const navigate = useNavigate();
    const [videos, setVideos] = useState([]); // Gerencia seu próprio estado de vídeos
    const [loading, setLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // --- NOVA LÓGICA DE BUSCA ---
    useEffect(() => {
        const fetchVideos = async () => {
            setLoading(true);
            
            let query = supabase
                .from('videos')
                .select('*, creator_id (id, username, creatorAvatar)')
                .order('created_at', { ascending: false });

            // Aplica filtro de categoria se houver
            if (selectedCategory) {
                query = query.eq('category', selectedCategory);
            }

            // Aplica filtro de busca por título se houver
            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`); // ilike é case-insensitive
            }

            const { data, error } = await query;

            if (error) {
                console.error("Erro ao buscar vídeos:", error);
            } else {
                setVideos(data);
            }
            setLoading(false);
        };

        // Adiciona um pequeno delay para não buscar a cada tecla digitada
        const debounceTimer = setTimeout(() => {
            fetchVideos();
        }, 300); // 300ms de espera

        return () => clearTimeout(debounceTimer); // Limpa o timer
    }, [selectedCategory, searchTerm]); // Roda a busca sempre que os filtros mudam

    const handleNavigation = (path) => {
        setIsNavigating(true);
        setTimeout(() => { navigate(path); }, 500);
    };

    return (
        <AnimatedPage>
            {isNavigating && <PageTransition />}
            <div className="space-y-8">
                <div>
                    <h2 className="font-anton text-white text-2xl mb-6 text-left">Todos os Casos</h2>
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : (
                        videos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                                {videos.map((video) => (
                                    <VideoCard key={video.id} video={video} onNavigate={handleNavigation} />
                                ))}
                            </div>
                        ) : (
                            <p className="col-span-full text-gray-400 text-center py-10">Nenhum caso encontrado para os filtros selecionados.</p>
                        )
                    )}
                </div>
            </div>
        </AnimatedPage>
    );
}