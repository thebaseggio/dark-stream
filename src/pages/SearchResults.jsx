// src/pages/SearchResults.jsx (versão final com "Super Card")

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import SkeletonCard from './SkeletonCard';
import { getPartnerProfilePath } from '../utils/partnerProfile';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';

// Componente para um card de vídeo individual (reutilizado)
function VideoCard({ video, onNavigate }) {
    const videoPath = `/video/${video.id}`;
    return (
        <div onClick={() => onNavigate(videoPath)} className="bg-zinc-900 border border-white/10 p-4 flex flex-col h-full group cursor-pointer transition-colors hover:border-white/20">
            <div className="relative w-full aspect-video mb-3 overflow-hidden border border-white/10">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"/>
            </div>
            <div className="flex flex-col flex-grow">
                <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 leading-snug group-hover:text-white transition-colors">{video.title}</h2>
            </div>
        </div>
    );
}

// O NOVO "SUPER CARD": Um grupo que mostra o Parceiro e seus vídeos
function PartnerResultGroup({ partner, videos, onNavigate, partnerId }) {
    const partnerPath = getPartnerProfilePath({ username: partner.username, id: partnerId }) || `/parceiro/${partnerId}`;
    return (
        <div className="col-span-full bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 mb-8">
            <Link to={partnerPath} className="flex items-center gap-4 mb-6 group/partner cursor-pointer">
                <img src={partner.avatar} alt={partner.username} className="w-16 h-16 rounded-full object-cover transition-transform duration-300 group-hover/partner:scale-110"/>
                <div>
                    <h2 className="font-anton text-white text-3xl group-hover/partner:text-[#f1c40f] transition-colors">{partner.username}</h2>
                </div>
            </Link>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {videos.map(video => <VideoCard key={video.id} video={video} onNavigate={onNavigate} />)}
            </div>
        </div>
    )
}

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const navigate = useNavigate();

    const [groupedResults, setGroupedResults] = useState({ partners: {}, videos: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!query) {
            setLoading(false);
            return;
        }

        const performSearch = async () => {
            setLoading(true);
            const { data, error } = await supabase.rpc('search_darkstream', { search_term: query });

            if (error) {
                console.error("Erro na busca:", error);
                setGroupedResults({ partners: {}, videos: [] });
            } else {
                // Lógica para agrupar os resultados
                const groups = { partners: {}, videos: [] };
                data.forEach(item => {
                    if (item.type === 'video_from_partner') {
                        if (!groups.partners[item.creator_id]) {
                            groups.partners[item.creator_id] = {
                                username: item.creator_username,
                                avatar: item.creator_avatar,
                                videos: []
                            };
                        }
                        groups.partners[item.creator_id].videos.push(item);
                    } else if (item.type === 'video') {
                        groups.videos.push(item);
                    }
                });
                setGroupedResults(groups);
            }
            setLoading(false);
        };

        performSearch();
    }, [query]);

    const handleNavigation = (path) => navigate(path);
    
    const partnerGroups = Object.entries(groupedResults.partners);

    return (
        <AnimatedPage>
            <SeoHead
              title={query ? `Busca: ${query} | Dark Stream` : 'Buscar | Dark Stream'}
              description={DEFAULT_SITE_DESCRIPTION}
            />
            <div className="space-y-8">
                <div>
                    <h2 className="font-anton text-white text-2xl mb-6 text-left">
                        {query ? `Resultados da busca para: "${query}"` : 'Faça uma busca'}
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : (
                        (partnerGroups.length > 0 || groupedResults.videos.length > 0) ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                                {partnerGroups.map(([creatorId, partnerData]) => (
                                    <PartnerResultGroup key={creatorId} partner={partnerData} partnerId={creatorId} videos={partnerData.videos} onNavigate={handleNavigation} />
                                ))}
                                {groupedResults.videos.map((video) => (
                                    <VideoCard key={video.id} video={video} onNavigate={handleNavigation} />
                                ))}
                            </div>
                        ) : (
                            <p className="col-span-full text-gray-400 text-center py-10">
                                Nenhum resultado encontrado para "{query}".
                            </p>
                        )
                    )}
                </div>
            </div>
        </AnimatedPage>
    );
}