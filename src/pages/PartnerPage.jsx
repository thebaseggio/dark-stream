import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import VideoCard from '../components/VideoCard'; // Importado para "Mais de..."
import { useNotification } from '../contexts/NotificationProvider';

// Ícone de verificado
const VerifiedIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10.09,16.5L6.5,12.91L7.91,11.5L10.09,13.67L16.08,7.68L17.5,9.09L10.09,16.5Z" /></svg> );

export default function VideoPlayer({ currentUser }) {
    const { id: videoId } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [relatedVideos, setRelatedVideos] = useState([]);
    const videoRef = useRef(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);
    const [notification, setNotification] = useState({ show: false, message: '', type: '' });

    // Função para mostrar notificação
    const showNotification = (type, message) => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    };

    useEffect(() => {
        const fetchVideoAndComments = async () => {
            setLoading(true);
            // Incrementa as visualizações
            await supabase.rpc('increment_video_views', { video_id: videoId });

            const { data: videoData, error: videoError } = await supabase
                .from('videos')
                .select(`
                    *,
                    profiles(id, username, creatorAvatar:avatar_url, role)
                `)
                .eq('id', videoId)
                .single();

            if (videoError || !videoData) {
                console.error("Erro ao buscar vídeo:", videoError);
                setLoading(false);
                return;
            }

            setVideo(videoData);
            
            // Buscar comentários
            const { data: commentsData, error: commentsError } = await supabase
                .from('comments')
                .select(`
                    *,
                    profiles(id, username, avatar_url)
                `)
                .eq('video_id', videoId)
                .order('created_at', { ascending: false });

            if (commentsError) {
                console.error("Erro ao buscar comentários:", commentsError);
            } else {
                setComments(commentsData);
            }

            // Buscar vídeos relacionados do mesmo criador (para "Mais de...")
            const { data: relatedData, error: relatedError } = await supabase
                .from('videos')
                .select(`
                    id, title, thumbnail_url, views, created_at,
                    creator_id, profiles(username, role)
                `)
                .eq('creator_id', videoData.creator_id)
                .neq('id', videoId) // Excluir o vídeo atual
                .order('created_at', { ascending: false })
                .limit(5);

            if (relatedError) {
                console.error("Erro ao buscar vídeos relacionados:", relatedError);
            } else {
                // Mapear para incluir creator_username e creator_role no objeto video
                setRelatedVideos(relatedData.map(v => ({
                    ...v,
                    creator_username: v.profiles.username,
                    creator_role: v.profiles.role // Adiciona a role aqui
                })));
            }
            
            // Verificar subscrição e contagem de seguidores
            if (currentUser && videoData.creator_id) {
                const { data: userSubData } = await supabase
                    .from('subscriptions')
                    .select('id')
                    .eq('creator_id', videoData.creator_id)
                    .eq('follower_id', currentUser.id)
                    .maybeSingle();
                setIsSubscribed(!!userSubData);
            }

            const { count: subsCount, error: subsCountError } = await supabase
                .from('subscriptions')
                .select('*', { count: 'exact', head: true })
                .eq('creator_id', videoData.creator_id);

            if (!subsCountError) {
                setSubscriberCount(subsCount || 0);
            }

            setLoading(false);
        };

        fetchVideoAndComments();
    }, [videoId, currentUser]);

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


    if (loading) return <div className="text-center p-10">Carregando vídeo...</div>;
    if (!video) return <div className="text-center p-10">Vídeo não encontrado.</div>;

    return (
        <AnimatedPage>
            <Notification show={notification.show} message={notification.message} type={notification.type} />
            <div className="flex flex-col lg:flex-row gap-6 p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto">
                {/* Main Content Area */}
                <div className="flex-grow lg:w-2/3">
                    <div className="aspect-video bg-zinc-800 rounded-lg overflow-hidden">
                        <video controls src={video.video_url} ref={videoRef} className="w-full h-full object-cover"></video>
                    </div>
                    <h1 className="text-2xl font-bold text-white mt-4">{video.title}</h1>
                    <p className="text-gray-400 text-sm mt-1">Postado em {new Date(video.created_at).toLocaleDateString('pt-BR')} de {new Date(video.created_at).getFullYear()}</p>

                    {/* Creator Info & Actions */}
                    <div className="flex items-center justify-between mt-4 border-b border-zinc-700 pb-4">
                        <div className="flex items-center gap-3">
                            <img src={video.profiles?.creatorAvatar || `https://ui-avatars.com/api/?name=${video.profiles?.username.charAt(0)}&background=27272a&color=f1c40f&bold=true`} alt={video.profiles?.username} className="w-12 h-12 rounded-full object-cover cursor-pointer" onClick={() => navigate(`/partner/${video.creator_id}`)}/>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-white font-semibold cursor-pointer" onClick={() => navigate(`/partner/${video.creator_id}`)}>{video.profiles?.username}</span>
                                    {video.profiles?.role === 'partner' && <VerifiedIcon className="w-4 h-4 text-blue-500" title="Parceiro Verificado"/>}
                                </div>
                                <span className="text-gray-400 text-sm">{subscriberCount.toLocaleString('pt-BR')} seguidores</span>
                            </div>
                        </div>
                        {currentUser?.id !== video.creator_id && (
                            <button
                                onClick={handleFollowToggle}
                                disabled={isProcessingFollow}
                                className={`font-semibold px-6 py-2 rounded-lg transition-all duration-200 text-sm ${
                                    isSubscribed 
                                    ? 'bg-zinc-700 hover:bg-zinc-600 text-white' 
                                    : 'bg-[#f1c40f] hover:bg-opacity-90 text-black'
                                }`}
                            >
                                {isProcessingFollow ? '...' : (isSubscribed ? 'Seguindo ✓' : 'Inscrever-se')}
                            </button>
                        )}
                    </div>

                    {/* Video Description */}
                    <div className="bg-zinc-800 p-4 rounded-lg mt-4 text-gray-300">
                        <p className="font-semibold text-white mb-2">{formattedViews(video.views)} visualizações • {timeAgo(video.created_at)}</p>
                        <p>{video.description}</p>
                    </div>

                    {/* Comments Section */}
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-white">{comments.length} Comentários</h2>
                        <div className="mt-4 flex gap-3 items-start">
                            <img src={currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${currentUser?.username.charAt(0) || 'U'}&background=27272a&color=f1c40f&bold=true`} alt="Your Avatar" className="w-10 h-10 rounded-full object-cover"/>
                            <textarea
                                className="flex-grow p-2 bg-zinc-800 rounded-md text-white border border-zinc-700 focus:border-[#f1c40f] outline-none resize-y"
                                placeholder="Adicione um comentário..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows="2"
                            />
                            <button
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                className="bg-[#f1c40f] text-black px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 disabled:bg-zinc-700 disabled:text-gray-400 transition-colors"
                            >
                                Comentar
                            </button>
                        </div>
                        <div className="mt-6 space-y-4">
                            {comments.map(comment => (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <img src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.username.charAt(0) || 'U'}&background=27272a&color=f1c40f&bold=true`} alt={comment.profiles?.username} className="w-9 h-9 rounded-full object-cover"/>
                                    <div className="flex flex-col">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-white font-semibold text-sm">{comment.profiles?.username}</span>
                                            <span className="text-gray-500 text-xs">{timeAgo(comment.created_at)}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm mt-1">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Related Videos Sidebar */}
                <div className="lg:w-1/3 space-y-4">
                    <h2 className="text-xl font-bold text-white">Mais de {video.profiles?.username}</h2>
                    {relatedVideos.map(relatedVideo => (
                        <VideoCard key={relatedVideo.id} video={relatedVideo} orientation="horizontal" onNavigate={(path) => navigate(path)} />
                    ))}
                </div>
            </div>
        </AnimatedPage>
    );
}