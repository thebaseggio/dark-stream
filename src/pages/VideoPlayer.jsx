// src/pages/VideoPlayer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';

// --- Ícones SVG ---
const PlayIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> );
const PauseIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> );
const VolumeHighIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg> );
const VolumeMuteIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg> );
const FullscreenIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg> );
const BackIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg> );
const LoadingSpinner = () => ( <div className="w-12 h-12 border-4 border-zinc-700 border-t-[#f1c40f] rounded-full animate-spin"></div> );
const ThumbsUpIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"></path></svg> );
const ThumbsDownIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"></path></svg> );
const SuperLikeIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"></path></svg> );

function ReplyItem({ reply }) {
    if (!reply.author) return null;
    return (
        <div className="flex items-start space-x-3 mt-4">
            <img className="h-10 w-10 rounded-full object-cover" src={reply.author.creatorAvatar || `...`} alt={reply.author.username} />
            <div className="flex-1">
                <p className="font-bold text-sm text-white">{reply.author.username} <span className="text-xs text-zinc-400 font-normal ml-2">{new Date(reply.created_at).toLocaleDateString('pt-BR')}</span></p>
                <p className="text-zinc-300 mt-1">{reply.content}</p>
            </div>
        </div>
    );
}

function CommentWithReplies({ comment }) {
    return (
        <div className="flex items-start gap-4">
            <img src={comment.author.creatorAvatar || `...`} alt={comment.author.username} className="w-10 h-10 rounded-full"/>
            <div className="flex-1">
                <p className="font-bold text-sm text-white">{comment.author.username} <span className="text-xs text-zinc-400 font-normal ml-2">{new Date(comment.created_at).toLocaleDateString('pt-BR')}</span></p>
                <p className="text-zinc-300 mt-1">{comment.content}</p>

                {/* Renderiza as respostas se elas existirem */}
                {comment.comment_replies?.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-zinc-800 space-y-4">
                        {comment.comment_replies.map(reply => <ReplyItem key={reply.id} reply={reply} />)}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VideoPlayer({ user }) {
    const { id: videoId } = useParams();
    const navigate = useNavigate();

    // --- SEÇÃO DE ESTADOS (VERSÃO CORRIGIDA E LIMPA) ---
    const [video, setVideo] = useState(null);
    const [updateShorts, setUpdateShorts] = useState([]); 
    const [relatedVideos, setRelatedVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [comments, setComments] = useState([]);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);
    const [userRating, setUserRating] = useState(0); 
    const [isProcessingRating, setIsProcessingRating] = useState(false);
    
    // Estados do Player e UI
    const [showIntro, setShowIntro] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [areControlsVisible, setAreControlsVisible] = useState(true);
    const [introStep, setIntroStep] = useState(1);
    const [fadeOutFirstPart, setFadeOutFirstPart] = useState(false);
    const [fadeOutSecondPart, setFadeOutSecondPart] = useState(false);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    // --- Seção de Refs ---
    const inactivityTimerRef = useRef(null);
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);

    // --- Seção de Funções de Controle (sem alterações) ---
    const handleCommentSubmit = async (e) => { e.preventDefault(); if (!newComment.trim()) return; if (!user) { navigate('/login'); return; } setIsPostingComment(true); const { data: insertedComment, error } = await supabase.from('comments').insert({ content: newComment, video_id: videoId, user_id: user.id }).select('*, user_id (id, username, creatorAvatar)').single(); if (error) { console.error("Erro ao enviar comentário:", error); } else { setComments(prevComments => [insertedComment, ...prevComments]); setNewComment(''); } setIsPostingComment(false); };
    const handleFollowToggle = async () => { if (!user) { navigate('/login'); return; } if (user.id === video.creator_id.id) return; setIsProcessingFollow(true); if (isSubscribed) { const { error } = await supabase.from('subscriptions').delete().match({ creator_id: video.creator_id.id, follower_id: user.id }); if (!error) { setIsSubscribed(false); setSubscriberCount(prev => prev - 1); } } else { const { error } = await supabase.from('subscriptions').insert({ creator_id: video.creator_id.id, follower_id: user.id }); if (!error) { setIsSubscribed(true); setSubscriberCount(prev => prev + 1); } } setIsProcessingFollow(false); };
    const handleActivity = () => { setAreControlsVisible(true); if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current); inactivityTimerRef.current = setTimeout(() => { const video = videoRef.current; if (video && !video.paused && !video.muted) { setAreControlsVisible(false); } }, 3000); };
    const togglePlayPause = () => { const video = videoRef.current; if (!video) return; if (video.paused) { video.play(); } else { video.pause(); } };
    const toggleMute = () => { const video = videoRef.current; if (!video) return; video.muted = !video.muted; setIsMuted(video.muted); if (!video.muted && video.volume === 0) { video.volume = 1; setVolume(1); } };
    const handleVolumeChange = (e) => { const video = videoRef.current; if (!video) return; const newVolume = parseFloat(e.target.value); video.volume = newVolume; setVolume(newVolume); if (newVolume > 0 && video.muted) { video.muted = false; setIsMuted(false); } else if (newVolume === 0) { video.muted = true; setIsMuted(true); }};
    const handleProgressChange = (e) => { const video = videoRef.current; if(!video) return; const newTime = parseFloat(e.target.value); video.currentTime = newTime; setCurrentTime(newTime); };
    const toggleFullScreen = () => { if (!document.fullscreenElement) { playerContainerRef.current?.requestFullscreen(); } else { document.exitFullscreen(); } };
    const formatTime = (timeInSeconds) => { if (isNaN(timeInSeconds)) return '00:00'; const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0'); const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0'); return `${minutes}:${seconds}`; };

    // --- Seção de Efeitos ---

    useEffect(() => {
        const fetchData = async () => {
            if (!videoId) return;
            setLoading(true);
            
            // 1. Busca o vídeo principal
            const { data: videoData, error: videoError } = await supabase.from('videos').select('*, creator_id (id, username, creatorAvatar)').eq('id', videoId).single();
            if (videoError || !videoData) { console.error("Erro ao buscar vídeo:", videoError); setLoading(false); return; }
            setVideo(videoData);

            const creatorId = videoData.creator_id.id;

            // 2. Busca todos os outros dados em paralelo
            const [commentsRes, subsCountRes, userSubRes, userRatingRes, shortsRes] = await Promise.all([
                // A query de comentários agora busca as respostas aninhadas
                supabase.from('comments')
                    .select(`
                        *,
                        author:user_id ( id, username, creatorAvatar ),
                        comment_replies ( *, author:user_id ( id, username, creatorAvatar ) )
                    `)
                    .eq('video_id', videoId)
                    .order('created_at', { ascending: false }),
                
                // O resto das buscas continua igual
                supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', creatorId),
                user ? supabase.from('subscriptions').select('id').eq('creator_id', creatorId).eq('follower_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
                user ? supabase.from('ratings').select('rating_value').eq('video_id', videoId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
                supabase.from('videos').select('id, title, thumbnail').eq('parent_video_id', videoId).eq('is_short', true).order('created_at', { ascending: true })
            ]);

            setComments(commentsRes.data || []);
            setSubscriberCount(subsCountRes.count || 0);
            setIsSubscribed(!!userSubRes.data);
            setUserRating(userRatingRes.data?.rating_value || 0);
            setUpdateShorts(shortsRes.data || []); // << SALVA OS SHORTS NO ESTADO

            setLoading(false);
            setIsLoadingComments(false);
        };
        fetchData();
    }, [videoId, user]);

useEffect(() => {
    const registerView = async () => {
        if (videoId) {
            // A chamada correta para a nova função 'increment_views'
            const { error } = await supabase.rpc('increment_views', {
                video_row_id: videoId,
                viewer_id: user?.id // Passa o ID do usuário, ou null se não logado
            });

            if (error) {
                console.error('Erro ao registrar view:', error);
            }
        }
    };
    
    // Usamos um pequeno timeout para não registrar a view imediatamente
    // caso o usuário saia da página muito rápido.
    const timer = setTimeout(() => {
        registerView();
    }, 2000); // A view é registrada após 2 segundos

    return () => clearTimeout(timer); // Limpa o timer se o componente for desmontado

}, [videoId, user]); // A lista de dependências com [videoId] garante que isso rode apenas uma vez por vídeo.


const handleRatingSubmit = async (newRating) => {
    if (!user) { navigate('/login'); return; }
    setIsProcessingRating(true);

    // Se o usuário clicar no mesmo botão, ele desmarca a avaliação
    if (newRating === userRating) {
        const { error } = await supabase.from('ratings').delete().match({ video_id: videoId, user_id: user.id });
        if (!error) setUserRating(0);
    } else {
        // Se for uma nova avaliação ou uma mudança, usamos 'upsert' com a correção
        const { error } = await supabase
            .from('ratings')
            .upsert(
                { video_id: videoId, user_id: user.id, rating_value: newRating },
                { onConflict: 'video_id, user_id' } // <-- A MÁGICA ACONTECE AQUI
            );
        if (!error) setUserRating(newRating);
    }
    setIsProcessingRating(false);
};

    // Efeito para buscar vídeos relacionados (agora no lugar certo)
    useEffect(() => {
        const fetchRelated = async () => {
            if (video?.creator_id?.id) {
                const { data, error } = await supabase
                    .from('videos')
                    .select('id, title, thumbnail, creator_id(username)')
                    .eq('creator_id', video.creator_id.id)
                    .neq('id', videoId)
                    .limit(5);

                if (error) {
                    console.error("Erro ao buscar vídeos relacionados:", error);
                } else {
                    setRelatedVideos(data);
                }
            }
        };
        fetchRelated();
    }, [video, videoId]);

    // Efeitos da intro e do player (sem alterações)
    useEffect(() => { if (!loading && video) { const t1 = setTimeout(() => setFadeOutFirstPart(true), 3500); const t2 = setTimeout(() => setIntroStep(2), 4000); const t3 = setTimeout(() => setFadeOutSecondPart(true), 7500); const t4 = setTimeout(() => setShowIntro(false), 8000); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); }; } }, [loading, video]);
    useEffect(() => { const v = videoRef.current; if (showIntro === false && v) { v.muted = true; setIsMuted(true); const p = v.play(); if (p !== undefined) { p.catch(error => { console.log("Autoplay bloqueado.", error); setIsPlaying(false); }); } } }, [showIntro]);
    useEffect(() => { const v = videoRef.current; if (v) { const onPlay = () => setIsPlaying(true); const onPause = () => setIsPlaying(false); const setVideoDuration = () => setDuration(v.duration); const onTimeUpdate = () => { setCurrentTime(v.currentTime); setProgress((v.currentTime / v.duration) * 100 || 0); }; v.addEventListener('play', onPlay); v.addEventListener('pause', onPause); v.addEventListener('timeupdate', onTimeUpdate); v.addEventListener('loadedmetadata', setVideoDuration); return () => { v.removeEventListener('play', onPlay); v.removeEventListener('pause', onPause); v.removeEventListener('timeupdate', onTimeUpdate); v.removeEventListener('loadedmetadata', setVideoDuration); }; } }, [!showIntro]);
    useEffect(() => { const handleKeyDown = (e) => { const target = e.target; if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return; switch (e.key.toLowerCase()) { case ' ': e.preventDefault(); togglePlayPause(); break; case 'f': toggleFullScreen(); break; case 'm': toggleMute(); break; case 'arrowright': if (videoRef.current) videoRef.current.currentTime += 5; break; case 'arrowleft': if (videoRef.current) videoRef.current.currentTime -= 5; break; default: break; } }; window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [video]);

    if (loading) {
        return <div className="bg-black text-white min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;
    }
    if (!video) {
        return <div className="bg-black text-white min-h-screen flex items-center justify-center"><p>Vídeo não encontrado.</p></div>;
    }
    if (showIntro) {
        return (
            <div className="bg-black w-full h-full fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
                {introStep === 1 ? (
                    <div className={`text-center text-white p-4 animate-fade-in ${fadeOutFirstPart ? 'animate-fade-out' : ''}`}>
                        <p className="text-3xl font-anton text-gray-300">Dark Stream & <span className="text-[#f1c40f]">{video.creator_id?.username || 'Criador'}</span></p>
                        <p className="text-xl text-gray-300 mt-1">Apresentam:</p>
                    </div>
                ) : (
                    <div className={`text-center text-white p-4 animate-fade-in ${fadeOutSecondPart ? 'animate-fade-out' : ''}`}>
                        <h1 className="text-4xl md:text-6xl font-anton">{video.title}</h1>
                    </div>
                )}
                <button onClick={() => setShowIntro(false)} className="absolute bottom-6 right-6 bg-black/50 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-white/20 transition-colors">PULAR INTRO</button>
            </div>
        );
    }
    
    return (
        <AnimatedPage>
            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
                {/* O Player de Vídeo */}
                <div ref={playerContainerRef} className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden group mb-6 ${!areControlsVisible && !videoRef.current?.paused ? 'cursor-none' : ''}`} onMouseMove={handleActivity} onMouseLeave={() => setAreControlsVisible(false)} onTouchStart={handleActivity}>
                    <video ref={videoRef} onClick={togglePlayPause} onDoubleClick={toggleFullScreen} className="w-full h-full object-cover" src={video.videoUrl} />
                    <div className={`absolute top-0 left-0 right-0 p-4 lg:p-6 flex items-center gap-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${areControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                        <button onClick={() => navigate(-1)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors" title="Voltar"><BackIcon className="w-6 h-6" /></button>
                        <h1 className="text-white text-xl font-bold truncate">{video.title}</h1>
                    </div>
                    <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${areControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                        <input type="range" min="0" max={duration} value={currentTime} onChange={handleProgressChange} className="w-full h-1.5 custom-range" />
                        <div className="flex items-center justify-between mt-2 text-white">
                            <div className="flex items-center gap-4">
                                <button onClick={togglePlayPause} className="w-6 h-6">{isPlaying ? <PauseIcon /> : <PlayIcon />}</button>
                                <div className="flex items-center gap-2">
                                    <button onClick={toggleMute} className="w-6 h-6">{isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}</button>
                                    <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-24 h-1 custom-range" />
                                </div>
                                <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                            </div>
                            <button onClick={toggleFullScreen} className="w-6 h-6"><FullscreenIcon /></button>
                        </div>
                    </div>
                </div>
                
                {/* --- NOSSO NOVO LAYOUT DE DUAS COLUNAS --- */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-10">
                    
                    {/* --- COLUNA PRINCIPAL (ESQUERDA) --- */}
                    <div className="lg:col-span-2">
                        <h1 className="text-3xl font-bold text-white leading-tight">{video.title}</h1>
                        
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4">
                            <p className="text-sm text-zinc-400">Postado em {new Date(video.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            <div className="flex items-center gap-2 mt-4 sm:mt-0 bg-zinc-900 border border-zinc-800 rounded-full p-1">
                                <button onClick={() => handleRatingSubmit(1)} disabled={isProcessingRating} className={`p-2 rounded-full transition-colors ${userRating === 1 ? 'bg-[#f1c40f] text-black' : 'hover:bg-zinc-700 text-zinc-300'}`} title="Gostei"><ThumbsUpIcon className="w-5 h-5" /></button>
                                <button onClick={() => handleRatingSubmit(2)} disabled={isProcessingRating} className={`p-2 rounded-full transition-colors ${userRating === 2 ? 'bg-purple-500 text-white' : 'hover:bg-zinc-700 text-zinc-300'}`} title="Gostei muito"><SuperLikeIcon className="w-5 h-5" /></button>
                                <div className="w-px h-6 bg-zinc-700 mx-1"></div>
                                <button onClick={() => handleRatingSubmit(-1)} disabled={isProcessingRating} className={`p-2 rounded-full transition-colors ${userRating === -1 ? 'bg-red-600 text-white' : 'hover:bg-zinc-700 text-zinc-300'}`} title="Não gostei"><ThumbsDownIcon className="w-5 h-5" /></button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 my-6 py-4 border-y border-zinc-800">
                            <Link to={`/parceiro/${video.creator_id.id}`}>
                                <img src={video.creator_id.creatorAvatar || `https://ui-avatars.com/api/?name=${video.creator_id.username.charAt(0)}&background=f1c40f&color=000`} alt={video.creator_id.username} className="w-14 h-14 rounded-full object-cover"/>
                            </Link>
                            <div className="flex-grow">
                                <Link to={`/parceiro/${video.creator_id.id}`} className="font-bold text-white text-lg hover:text-[#f1c40f] transition-colors">{video.creator_id.username}</Link>
                                <p className="text-sm text-zinc-400">{subscriberCount.toLocaleString('pt-BR')} seguidores</p>
                            </div>
                            {user?.id !== video.creator_id.id && (
                                <button onClick={handleFollowToggle} disabled={isProcessingFollow} className={`font-semibold px-6 py-2 rounded-lg transition-all duration-200 w-40 text-center text-sm ${isSubscribed ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-white hover:bg-zinc-200 text-black'}`}>{isProcessingFollow ? '...' : (isSubscribed ? 'Inscrito ✓' : 'Inscrever-se')}</button>
                            )}
                        </div>

                        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
                            <p className="text-white whitespace-pre-wrap leading-relaxed">{video.description || 'Nenhuma descrição fornecida.'}</p>
                        </div>
                        <div className="mt-10">
                            <h3 className="text-xl font-bold text-white mb-6">{comments.length.toLocaleString('pt-BR')} Comentários</h3>                            {user ? (
                                <form onSubmit={handleCommentSubmit} className="flex items-start gap-4 mb-8">
                                    <img src={user.profile?.creatorAvatar || `https://ui-avatars.com/api/?name=${user.email.charAt(0)}&background=8e44ad&color=FFF`} alt="Seu avatar" className="w-10 h-10 rounded-full"/>
                                    <div className="flex-1">
                                        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Adicione um comentário..." rows="2" className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-3 text-white focus:outline-none focus:border-[#f1c40f] transition-colors" />
                                        <div className="text-right mt-2">
                                            <button type="submit" disabled={isPostingComment || !newComment.trim()} className="bg-[#f1c40f] text-black font-bold px-5 py-2 rounded-md transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">{isPostingComment ? "Enviando..." : "Comentar"}</button>
                                        </div>
                                    </div>
                                </form>
                            ) : ( <p className="text-zinc-400 mb-8">Você precisa <Link to="/login" className="text-[#f1c40f] hover:underline">fazer login</Link> para comentar.</p> )}
                    <div className="space-y-6">
                        {isLoadingComments ? ( <p>Carregando...</p> ) : (
                            // Usamos o novo sub-componente para renderizar os comentários e suas respostas
                            comments.map(comment => (
                                <CommentWithReplies key={comment.id} comment={comment} />
                            ))
                        )}
                    </div>
                </div>
                    </div>
                    {/* --- BARRA LATERAL --- */}
                    <div className="lg:col-span-1">
                        <div className="bg-zinc-900 rounded-lg p-4 sticky top-24 space-y-8">
                            
                            {/* 1. Seção de Updates (Shorts) */}
                            {updateShorts.length > 0 && (
                                <div>
                                    <h4 className="font-bold text-white mb-4">Updates do Caso (Shorts)</h4>
                                    <div className="space-y-4">
                                        {updateShorts.map(short => (
                                            <Link to={`/video/${short.id}`} key={short.id} className="flex items-center gap-4 group">
                                                <div className="w-28 flex-shrink-0"><img src={short.thumbnail} alt={short.title} className="w-full aspect-video object-cover rounded-md" /></div>
                                                <div><h5 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-[#f1c40f]">{short.title}</h5></div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 2. Seção "Mais de..." */}
                            <div>
                                <h4 className="font-bold text-white mb-4">Mais de {video.creator_id.username}</h4>
                                <div className="space-y-4">
                                    {relatedVideos.length > 0 ? (
                                        relatedVideos.map(related => (
                                            <Link to={`/video/${related.id}`} key={related.id} className="flex items-center gap-4 group">
                                                <div className="w-28 flex-shrink-0"><img src={related.thumbnail} alt={related.title} className="w-full aspect-video object-cover rounded-md" /></div>
                                                <div>
                                                    <h5 className="text-sm font-bold text-white leading-tight line-clamp-2 group-hover:text-[#f1c40f]">{related.title}</h5>
                                                    <p className="text-xs text-zinc-400 mt-1">{related.creator_id.username}</p>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className="text-sm text-zinc-400">Nenhum outro caso encontrado deste Parceiro.</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
}