// src/pages/Explore.jsx (versão final)

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import SkeletonCard from './SkeletonCard';
import CategoryRow from '../components/CategoryRow';
import { useNavigate } from 'react-router-dom';

export default function Explore() {
    const navigate = useNavigate();
    const [groupedVideos, setGroupedVideos] = useState({});
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isNavigating, setIsNavigating] = useState(false);
    const [shorts, setShorts] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);

            // Busca os shorts primeiro (ou em paralelo)
            const { data: shortsData, error: shortsError } = await supabase
                .from('videos')
                .select('*, creator_id (id, username, "creatorAvatar")')
                .eq('is_short', true)
                .order('created_at', { ascending: false })
                .limit(10); // Limita para não buscar todos de uma vez

            if (shortsError) {
                console.error("Erro ao buscar shorts:", shortsError);
            } else {
                setShorts(shortsData || []);
            }
            
            const { data: categoriesData, error: categoriesError } = await supabase
                .from('categories')
                .select('name')
                .order('created_at', { ascending: true });

            if (categoriesError) {
                console.error("Erro ao buscar categorias:", categoriesError);
                setLoading(false);
                return;
            }

            const { data: videos, error: videosError } = await supabase
                .from('videos')
                .select('*, creator_id (id, username, "creatorAvatar")')
                .order('created_at', { ascending: false });

            if (videosError) {
                console.error("Erro ao buscar vídeos:", videosError);
            } else {
                // FILTRE OS SHORTS DA LISTA PRINCIPAL
                const regularVideos = videos.filter(video => !video.is_short); 

                const categoryOrder = categoriesData.map(c => c.name);
                const groups = {};
                categoryOrder.forEach(cat => { groups[cat] = []; });
                
                // USE A LISTA FILTRADA PARA MONTAR OS GRUPOS
                regularVideos.forEach(video => { 
                    if (Array.isArray(video.category)) {
                        video.category.forEach(cat => {
                            if (groups[cat]) {
                                groups[cat].push(video);
                            }
                        });
                    }
                });
                setCategories(categoryOrder);
                setGroupedVideos(groups);
            }
            setLoading(false);
        };

        fetchInitialData();
    }, []);

        const handleNavigation = (path) => {
        setIsNavigating(true);
        setTimeout(() => { navigate(path); }, 500); 
    };

    return (
        <AnimatedPage>
            <div className="space-y-12 py-8">
                {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-4">
                            <div className="h-8 w-1/4 bg-zinc-800 rounded-md animate-pulse"></div>
                            <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-4">
                                {Array.from({ length: 4 }).map((_, j) => 
                                    <div key={j} className="flex-shrink-0 w-64">
                                        <SkeletonCard />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <> {/* Usamos um fragmento para agrupar as fileiras */}
                        
                        {/* ADICIONE A NOVA FILEIRA DE SHORTS AQUI */}
                        {shorts.length > 0 && (
                            <CategoryRow 
                                key="shorts-updates" 
                                title="Atualizações e Shorts" 
                                videos={shorts} 
                                onNavigate={handleNavigation}
                                variant="short" 
                            />
                        )}

                        {/* O MAP DAS OUTRAS CATEGORIAS CONTINUA ABAIXO */}
                        {categories.map(category => (
                            <CategoryRow 
                                key={category} 
                                title={category} 
                                videos={groupedVideos[category]} 
                                onNavigate={handleNavigation} 
                            />
                        ))}
                    </>
                )}
            </div>
        </AnimatedPage>
    );
}