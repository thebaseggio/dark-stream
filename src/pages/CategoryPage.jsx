// src/pages/CategoryPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import SkeletonCard from './SkeletonCard';
import { getPartnerProfilePath } from '../utils/partnerProfile';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';

// Reutilizamos o VideoCard do Explore.jsx (idealmente, ele viveria em src/components/)
function VideoCard({ video }) {
    const navigate = useNavigate();
    const creator = video.creator_id;
    return (
        <div onClick={() => navigate(`/video/${video.id}`)} className="bg-zinc-900 border border-white/10 p-4 flex flex-col h-full group cursor-pointer transition-colors hover:border-white/20">
            <div className="relative w-full aspect-video mb-3 overflow-hidden border border-white/10">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"/>
            </div>
            <div className="flex flex-col flex-grow">
                <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 leading-snug group-hover:text-white transition-colors">{video.title}</h2>
                <div className="flex-grow"></div>
                {creator && (
                    <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center gap-2">
                        <Link
                          to={getPartnerProfilePath(creator) || `/parceiro/${creator.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 group/creator"
                        >
                            <img src={creator.creatorAvatar} alt={creator.username} className="w-6 h-6 rounded-full object-cover"/>
                            <p className="text-xs text-gray-400 group-hover/creator:text-white ...">{creator.username}</p>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CategoryPage() {
    const { categoryName } = useParams();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategoryVideos = async () => {
            setLoading(true);
            const decodedCategoryName = decodeURIComponent(categoryName);

            const { data: arrayMatches, error: arrayError } = await supabase
                .from('videos')
                .select('*, creator_id (id, username, "creatorAvatar")')
                .contains('category', [decodedCategoryName])
                .eq('is_short', false)
                .is('parent_video_id', null)
                .order('created_at', { ascending: false });

            const { data: textMatches, error: textError } = await supabase
                .from('videos')
                .select('*, creator_id (id, username, "creatorAvatar")')
                .eq('category', decodedCategoryName)
                .eq('is_short', false)
                .is('parent_video_id', null)
                .order('created_at', { ascending: false });

            if (arrayError && textError) {
                console.error("Erro ao buscar vídeos da categoria:", arrayError, textError);
            } else {
                const merged = [...(arrayMatches || []), ...(textMatches || [])];
                const unique = merged.filter((video, index, list) =>
                    list.findIndex(v => v.id === video.id) === index
                );
                setVideos(unique);
            }
            setLoading(false);
        };

        fetchCategoryVideos();
    }, [categoryName]);

    return (
        <AnimatedPage>
            <SeoHead
              title={`${decodeURIComponent(categoryName)} | Dark Stream`}
              description={DEFAULT_SITE_DESCRIPTION}
            />
            <div className="py-8">
                <h2 className="font-anton text-white text-3xl mb-8">
                    Categoria: <span className="text-[#f1c40f]">{decodeURIComponent(categoryName)}</span>
                </h2>
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                    </div>
                ) : (
                    videos.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {videos.map((video) => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center">Nenhum vídeo encontrado nesta categoria.</p>
                    )
                )}
            </div>
        </AnimatedPage>
    );
}