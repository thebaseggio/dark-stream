// src/pages/PartnerPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';

function VideoCard({ video }) {
    const navigate = useNavigate();
    return (
        <div 
            onClick={() => navigate(`/video/${video.id}`)}
            className="bg-black border-2 border-zinc-800 rounded-lg p-3 flex flex-col h-full cursor-pointer group transform transition-transform duration-300 hover:scale-[1.03] hover:border-[#f1c40f]"
        >
            <img src={video.thumbnail || `https://placehold.co/480x360/000000/FFF?text=${video.title}`} alt={video.title} className="rounded-md object-cover w-full h-40 mb-2"/>
            <h2 className="font-anton text-center text-white text-base capitalize tracking-wide leading-snug mt-2 line-clamp-2 flex-grow">
                {video.title}
            </h2>
            <div className="mt-auto flex justify-center gap-2 pt-2">
                <Link to={`/video/${video.id}`} onClick={(e) => e.stopPropagation()} className="bg-[#f1c40f] hover:bg-opacity-90 text-[#040402] font-bold py-2 px-3 rounded text-xs text-center flex-1">
                    🎬 Assistir
                </Link>
            </div>
        </div>
    );
}

export default function PartnerPage({ currentUser }) {
    const { id: partnerId } = useParams();
    const navigate = useNavigate();

    const [partnerProfile, setPartnerProfile] = useState(null);
    const [partnerVideos, setPartnerVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);

    useEffect(() => {
        // A função que contém o 'await' precisa ser 'async'
        const fetchPartnerData = async () => {
            if (!partnerId) return;
            setLoading(true);

            // O 'await' deve estar dentro da função 'async'
            const [profileRes, videosRes, subsCountRes, userSubRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', partnerId).single(),
                supabase.from('videos').select('*').eq('creator_id', partnerId),
                supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', partnerId),
                currentUser ? supabase.from('subscriptions').select('id').eq('creator_id', partnerId).eq('follower_id', currentUser.id).maybeSingle() : Promise.resolve({ data: null })
            ]);

            if (profileRes.error) {
                console.error("Erro ao buscar perfil:", profileRes.error);
                setLoading(false);
                return;
            }

            setPartnerProfile(profileRes.data);
            setPartnerVideos(videosRes.data || []);
            setSubscriberCount(subsCountRes.count || 0);
            setIsSubscribed(!!userSubRes.data);
            
            setLoading(false);
        };

        fetchPartnerData();
    }, [partnerId, currentUser]);

    const handleFollowToggle = async () => {
        if (!currentUser) {
            navigate('/login');
            return;
        }
        if (currentUser.id === partnerId) return;

        setIsProcessingFollow(true);
        if (isSubscribed) {
            const { error } = await supabase.from('subscriptions').delete().match({ creator_id: partnerId, follower_id: currentUser.id });
            if (!error) {
                setIsSubscribed(false);
                setSubscriberCount(prev => prev - 1);
            }
        } else {
            const { error } = await supabase.from('subscriptions').insert({ creator_id: partnerId, follower_id: currentUser.id });
            if (!error) {
                setIsSubscribed(true);
                setSubscriberCount(prev => prev + 1);
            }
        }
        setIsProcessingFollow(false);
    };

    if (loading) {
        return <div className="text-center p-10">Carregando perfil do Parceiro...</div>;
    }

    if (!partnerProfile) {
        return <div className="text-center p-10">Parceiro não encontrado.</div>;
    }

    return (
        <AnimatedPage>
            <div className="bg-zinc-900 rounded-lg p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
                <img 
                    src={partnerProfile.creatorAvatar || `https://ui-avatars.com/api/?name=${partnerProfile.username?.charAt(0)}&background=f1c40f&color=000&size=128`}
                    alt={partnerProfile.username}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-800"
                />
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold">{partnerProfile.username}</h1>
                    <p className="text-md text-gray-400 mt-2 max-w-2xl">{partnerProfile.bio}</p>
                    <div className="mt-4 flex items-center gap-4 justify-center md:justify-start">
                        {currentUser?.id !== partnerId && (
                            <button
                                onClick={handleFollowToggle}
                                disabled={isProcessingFollow}
                                className={`font-semibold px-6 py-2 rounded-lg transition-all duration-200 w-36 text-center ${isSubscribed ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-[#8e44ad] hover:bg-[#803d9c] text-white'}`}
                            >
                                {isProcessingFollow ? 'Aguarde...' : (isSubscribed ? 'Seguindo ✓' : 'Seguir')}
                            </button>
                        )}
                        <p className="text-sm text-gray-400">{subscriberCount.toLocaleString('pt-BR')} seguidores</p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="font-anton text-white text-2xl mb-6 text-left">Vídeos de {partnerProfile.username}</h2>
                {partnerVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                        {partnerVideos.map(video => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">Este parceiro ainda não publicou nenhum vídeo.</p>
                )}
            </div>
        </AnimatedPage>
    );
}