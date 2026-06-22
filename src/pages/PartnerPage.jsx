import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import VideoCard from '../components/VideoCard'; // Importado para "Mais de..."
import { useNotification } from '../contexts/NotificationProvider';

// Ícone de verificado
const VerifiedIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10.09,16.5L6.5,12.91L7.91,11.5L10.09,13.67L16.08,7.68L17.5,9.09L10.09,16.5Z" /></svg> );

export default function PartnerPage({ currentUser }) { 
    const { id: partnerId } = useParams(); // Renomeamos para partnerId para clareza
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    
    // ESTADOS PARA O PERFIL DO PARCEIRO E SEUS VÍDEOS
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [partnerVideos, setPartnerVideos] = useState([]);
    const [partnerShorts, setPartnerShorts] = useState([]);
    const [loading, setLoading] = useState(true);

    // ESTADOS PARA A FUNCIONALIDADE DE SEGUIR
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);

// Substitua seu useEffect por este:
useEffect(() => {
    const fetchPartnerData = async () => {
        if (!partnerId) return;
        setLoading(true);

        // 1. Busca os dados do perfil do Parceiro
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .single();

        if (profileError || !profileData) {
            console.error("Erro ao buscar perfil do parceiro:", profileError);
            setLoading(false);
            return;
        }
        setPartnerProfile(profileData);

        // 2. Busca os vídeos deste Parceiro
        const { data: videosData, error: videosError } = await supabase
            .from('videos')
            .select('*, creator:profiles(username, creatorAvatar, role)')
            .eq('creator_id', partnerId)
            .order('created_at', { ascending: false });

        if (videosError) {
            console.error("Erro ao buscar vídeos do parceiro:", videosError);
        } else {
    // 1. Separa os vídeos
    const regularVideos = videosData.filter(video => !video.is_short);
    const shorts = videosData.filter(video => video.is_short);

    // 2. Formata APENAS os vídeos normais
    const formattedRegular = regularVideos.map(video => ({
        ...video,
        thumbnail_url: video.thumbnail,
        creator_username: video.creator.username,
        creator_avatar_url: video.creator.creatorAvatar,
        creator_role: video.creator.role,
    }));
    setPartnerVideos(formattedRegular);

    // 3. Formata APENAS os shorts
    const formattedShorts = shorts.map(video => ({
        ...video,
        thumbnail_url: video.thumbnail,
        creator_username: video.creator.username,
        creator_avatar_url: video.creator.creatorAvatar,
        creator_role: video.creator.role,
    }));
    setPartnerShorts(formattedShorts);
}

        // 3. Busca a contagem de seguidores (opcional, mas bom ter)
        const { count, error: countError } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('creator_id', partnerId);
        
        if (!countError) setSubscriberCount(count || 0);

        // 4. Verifica se o usuário atual já segue este Parceiro
        if (currentUser) {
            const { data: subData, error: subError } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('creator_id', partnerId)
                .eq('follower_id', currentUser.id)
                .maybeSingle();

            if (!subError) setIsSubscribed(!!subData);
        }

        setLoading(false);
    };

    fetchPartnerData();
}, [partnerId, currentUser]);

    const handleLike = async () => { /* ... (sem alterações) ... */ };
    const handleDislike = async () => { /* ... (sem alterações) ... */ };
    const handleAddComment = async (e) => { /* ... (sem alterações) ... */ };

const handleFollowToggle = async () => {
    if (!currentUser) {
        showNotification('info', 'Você precisa estar logado para seguir um Parceiro.');
        navigate('/login');
        return;
    }
    if (currentUser.id === partnerId) {
        showNotification('error', 'Você não pode seguir a si mesmo!');
        return;
    }

    setIsProcessingFollow(true);
    if (isSubscribed) {
        const { error } = await supabase.from('subscriptions').delete().match({ creator_id: partnerId, follower_id: currentUser.id });
        if (error) {
            showNotification('error', `Erro: ${error.message}`);
        } else {
            setIsSubscribed(false);
            setSubscriberCount(prev => prev - 1);
            showNotification('success', `Você deixou de seguir ${partnerProfile.username}.`);
        }
    } else {
        const { error } = await supabase.from('subscriptions').insert({ creator_id: partnerId, follower_id: currentUser.id });
        if (error) {
            showNotification('error', `Erro: ${error.message}`);
        } else {
            setIsSubscribed(true);
            setSubscriberCount(prev => prev + 1);
            showNotification('success', `Agora você está seguindo ${partnerProfile.username}!`);
        }
    }
    setIsProcessingFollow(false);
};


    const formattedViews = (views) => {
        if (!views) return "0 visualizações";
        if (views >= 1000000) return `${(views / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}K`;
        return `${views}`;
    };

    const timeAgo = (timestamp) => {
        // ... (função timeAgo sem alterações)
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        const minutes = Math.floor(diffInSeconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        if (years > 0) return `${years} ano${years > 1 ? 's' : ''} atrás`;
        if (months > 0) return `${months} mês${months > 1 ? 'es' : ''} atrás`;
        if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
        if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
        return 'agora mesmo';
    };


// Substitua seu return por este:
if (loading) return <div className="text-center p-10">Carregando Parceiro...</div>;
if (!partnerProfile) return <div className="text-center p-10">Parceiro não encontrado.</div>;

// Substitua todo o seu return por este:

if (loading) return <div className="text-center p-10">Carregando Parceiro...</div>;
if (!partnerProfile) return <div className="text-center p-10">Parceiro não encontrado.</div>;

return (
    <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8"> {/* Adicionado space-y-8 */}
            {/* Seção do Banner e Cabeçalho */}
            <div>
                <div className="h-48 md:h-64 bg-zinc-800 rounded-lg mb-[-4rem] overflow-hidden">
                    {partnerProfile.banner_url && (
                        <img src={partnerProfile.banner_url} alt={`Banner de ${partnerProfile.username}`} className="w-full h-full object-cover"/>
                    )}
                </div>
                <div className="flex items-end gap-6 px-6 pt-8">
                    <img src={partnerProfile.creatorAvatar} alt={partnerProfile.username} className="w-32 h-32 rounded-full object-cover border-4 border-black flex-shrink-0"/>
                    <div className="flex-grow pb-4 flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold">{partnerProfile.username}</h1>
                            <p className="text-gray-400">{subscriberCount.toLocaleString('pt-BR')} seguidores</p>
                        </div>
                        {currentUser?.id !== partnerId && (
                            <button 
                                onClick={handleFollowToggle} 
                                disabled={isProcessingFollow}
                                className={`font-semibold px-6 py-2 rounded-lg transition-all duration-200 text-sm ${
                                    isSubscribed 
                                    ? 'bg-zinc-700 hover:bg-zinc-600 text-white' 
                                    : 'bg-white hover:bg-zinc-200 text-black'
                                }`}
                            >
                                {isProcessingFollow ? '...' : (isSubscribed ? 'Seguindo ✓' : 'Inscrever-se')}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Bio e Redes Sociais em um Card */}
            <div className="bg-zinc-900 p-6 rounded-lg">
                <p className="text-gray-300">{partnerProfile.bio}</p>
                {/* Futuramente, os ícones das redes sociais podem vir aqui */}
            </div>

            {/* Grade de Vídeos com Título Agrupado */}
{partnerVideos.length > 0 && (
    <div>
        <h2 className="text-2xl font-bold mb-6 px-6">Casos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {partnerVideos.map(video => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    </div>
)}

{/* Grade de Shorts */}
{partnerShorts.length > 0 && (
    <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 px-6">Atualizações e Shorts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {partnerShorts.map(short => (
                <VideoCard key={short.id} video={short} variant="short" />
            ))}
        </div>
    </div>
)}
        </div>
    </AnimatedPage>
);
}