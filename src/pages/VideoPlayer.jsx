// src/pages/VideoPlayer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';

// --- Ícones SVG para nossos controles (auto-contidos e fáceis de estilizar) ---
const PlayIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> );
const PauseIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> );
const VolumeHighIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg> );
const VolumeMuteIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg> );
const FullscreenIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg> );
const BackIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg> );
const LoadingSpinner = () => (
    <div className="w-12 h-12 border-4 border-zinc-700 border-t-[#f1c40f] rounded-full animate-spin"></div>
);
const HeartIcon = (props) => ( <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.5l1.318-1.182a4.5 4.5 0 116.364 6.364L12 21l-7.682-7.318a4.5 4.5 0 010-6.364z" /></svg> );
const HeartSolidIcon = (props) => ( <svg {...props} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg> );

export default function VideoPlayer({ user }) {
    const { id: videoId } = useParams();
    const navigate = useNavigate();

    // --- Seção de Estados ---
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);
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
    const [comments, setComments] = useState([]);
    const [isLoadingComments, setIsLoadingComments] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [isLiked, setIsLiked] = useState(false);
    const [isProcessingLike, setIsProcessingLike] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);
    const [nextVideo, setNextVideo] = useState(null);
    const [showNextVideoOverlay, setShowNextVideoOverlay] = useState(false);
    const [countdown, setCountdown] = useState(10); // Contagem regressiva de 10 segundos

    // --- Seção de Refs ---
    const inactivityTimerRef = useRef(null);
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);

    // --- Seção de Funções de Controle ---
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        if (!user) { navigate('/login'); return; }
        setIsPostingComment(true);
        const { data: insertedComment, error } = await supabase.from('comments').insert({ content: newComment, video_id: videoId, user_id: user.id }).select('*, user_id (id, username, creatorAvatar)').single();
        if (error) { console.error("Erro ao enviar comentário:", error); } 
        else { setComments(prevComments => [insertedComment, ...prevComments]); setNewComment(''); }
        setIsPostingComment(false);
    };

        const handleFollowToggle = async () => {
        if (!user) { navigate('/login'); return; }
        // Impede que o criador siga a si mesmo
        if (user.id === video.creator_id.id) return;

        setIsProcessingFollow(true);
        if (isSubscribed) {
            const { error } = await supabase.from('subscriptions').delete().match({ creator_id: video.creator_id.id, follower_id: user.id });
            if (!error) {
                setIsSubscribed(false);
                setSubscriberCount(prev => prev - 1);
            }
        } else {
            const { error } = await supabase.from('subscriptions').insert({ creator_id: video.creator_id.id, follower_id: user.id });
            if (!error) {
                setIsSubscribed(true);
                setSubscriberCount(prev => prev + 1);
            }
        }
        setIsProcessingFollow(false);
    };

    const handleActivity = () => {
        setAreControlsVisible(true);
        if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = setTimeout(() => {
            const video = videoRef.current;
            if (video && !video.paused && !video.muted) {
                 setAreControlsVisible(false);
            }
        }, 3000);
    };

        const handleLikeToggle = async () => {
        if (!user) { navigate('/login'); return; }
        setIsProcessingLike(true);
        if (isLiked) {
            // Descurtir (deletar o like)
            const { error } = await supabase.from('likes').delete().match({ video_id: videoId, user_id: user.id });
            if (!error) {
                setIsLiked(false);
                setLikeCount(prev => prev - 1);
            }
        } else {
            // Curtir (inserir o like)
            const { error } = await supabase.from('likes').insert({ video_id: videoId, user_id: user.id });
            if (!error) {
                setIsLiked(true);
                setLikeCount(prev => prev + 1);
            }
        }
        setIsProcessingLike(false);
    };

    const togglePlayPause = () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) { video.play(); } 
        else { video.pause(); }
    };

    const toggleMute = () => {
        const video = videoRef.current;
        if (!video) return;
        video.muted = !video.muted;
        setIsMuted(video.muted);
        if (!video.muted && video.volume === 0) {
            video.volume = 1;
            setVolume(1);
        }
    };

const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = parseFloat(e.target.value);

    // Define o nível do volume
    video.volume = newVolume;
    setVolume(newVolume);

    if (newVolume > 0 && video.muted) {
        video.muted = false;
        setIsMuted(false);
    } else if (newVolume === 0) {
        video.muted = true;
        setIsMuted(true);
    }
};

    const handleProgressChange = (e) => {
        const video = videoRef.current;
        if(!video) return;
        const newTime = parseFloat(e.target.value);
        video.currentTime = newTime;
        setCurrentTime(newTime);
    };
    
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return '00:00';
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!videoId) return;
            setLoading(true);
            const { data: videoData, error: videoError } = await supabase.from('videos').select('*, creator_id (id, username, creatorAvatar)').eq('id', videoId).single();
            if (videoError || !videoData) { console.error("Erro ao buscar vídeo:", videoError); setLoading(false); return; }
            setVideo(videoData);
            const creatorId = videoData.creator_id.id;
            const [commentsRes, likesCountRes, userLikeRes, subsCountRes, userSubRes] = await Promise.all([
                supabase.from('comments').select('*, user_id (id, username, creatorAvatar)').eq('video_id', videoId).order('created_at', { ascending: false }),
                supabase.from('likes').select('*', { count: 'exact', head: true }).eq('video_id', videoId),
                user ? supabase.from('likes').select('id').eq('video_id', videoId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
                supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', creatorId),
                user ? supabase.from('subscriptions').select('id').eq('creator_id', creatorId).eq('follower_id', user.id).maybeSingle() : Promise.resolve({ data: null })
            ]);
            setComments(commentsRes.data || []);
            setLikeCount(likesCountRes.count || 0);
            setIsLiked(!!userLikeRes.data);
            setSubscriberCount(subsCountRes.count || 0);
            setIsSubscribed(!!userSubRes.data);
            setLoading(false);
            setIsLoadingComments(false);
        };
        fetchData();
    }, [videoId, user]);

    useEffect(() => {
        if (!loading && video) {
            const fadeOutFirstPartTimer = setTimeout(() => setFadeOutFirstPart(true), 3500);
            const stepTimer = setTimeout(() => setIntroStep(2), 4000);
            const fadeOutSecondPartTimer = setTimeout(() => setFadeOutSecondPart(true), 7500);
            const introTimer = setTimeout(() => setShowIntro(false), 8000);
            return () => { clearTimeout(fadeOutFirstPartTimer); clearTimeout(stepTimer); clearTimeout(fadeOutSecondPartTimer); clearTimeout(introTimer); };
        }
    }, [loading, video]);

    useEffect(() => {
        const video = videoRef.current;
        if (showIntro === false && video) {
            video.muted = true;
            setIsMuted(true);
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => { console.log("Autoplay bloqueado.", error); setIsPlaying(false); });
            }
        }
    }, [showIntro]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            const onPlay = () => setIsPlaying(true);
            const onPause = () => setIsPlaying(false);
            const setVideoDuration = () => setDuration(videoElement.duration);
            
            const handleTimeUpdate = async () => {
                const currentTime = videoElement.currentTime;
                const duration = videoElement.duration;
                setCurrentTime(currentTime);
                setProgress((currentTime / duration) * 100 || 0);

                // Mostra o overlay nos últimos 10 segundos
                if (duration - currentTime <= 10 && !showNextVideoOverlay) {
                    if (!nextVideo) { // Busca o próximo vídeo apenas uma vez
                        const { data: nextVideoData } = await supabase
                            .from('videos')
                            .select('id, title, thumbnail')
                            .eq('creator_id', video.creator_id.id)
                            .neq('id', videoId) // Exclui o vídeo atual
                            .limit(1)
                            .single();
                        if (nextVideoData) setNextVideo(nextVideoData);
                    }
                    setShowNextVideoOverlay(true);
                }
            };
            
            videoElement.addEventListener('play', onPlay);
            videoElement.addEventListener('pause', onPause);
            videoElement.addEventListener('timeupdate', handleTimeUpdate);
            videoElement.addEventListener('loadedmetadata', setVideoDuration);

            return () => {
                videoElement.removeEventListener('play', onPlay);
                videoElement.removeEventListener('pause', onPause);
                videoElement.removeEventListener('timeupdate', handleTimeUpdate);
                videoElement.removeEventListener('loadedmetadata', setVideoDuration);
            };
        }
    }, [!showIntro, video, videoId, nextVideo, showNextVideoOverlay]); // Dependências atualizadas

    // --- NOVO EFEITO: Contagem regressiva para o próximo vídeo ---
    useEffect(() => {
        let timer;
        if (showNextVideoOverlay && nextVideo) {
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate(`/video/${nextVideo.id}`);
                        return 10;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [showNextVideoOverlay, nextVideo, navigate]);

        useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignora os atalhos se o usuário estiver digitando em uma caixa de texto (como a de comentários)
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case ' ': // Barra de Espaço
                    e.preventDefault(); // Impede a página de rolar para baixo
                    togglePlayPause();
                    break;
                case 'f': // Tecla F
                    toggleFullScreen();
                    break;
                case 'm': // Tecla M
                    toggleMute();
                    break;
                case 'arrowright': // Seta para a Direita
                    if (videoRef.current) videoRef.current.currentTime += 5; // Avança 5s
                    break;
                case 'arrowleft': // Seta para a Esquerda
                    if (videoRef.current) videoRef.current.currentTime -= 5; // Retrocede 5s
                    break;
                default:
                    break;
            }
        };

        // Adiciona o "espião" de teclado na janela
        window.addEventListener('keydown', handleKeyDown);

        // Limpeza: Remove o "espião" quando o componente não estiver mais na tela
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [video]); // A dependência garante que as funções como togglePlayPause tenham os estados mais recentes

    if (loading) { return <div className="bg-black text-white min-h-screen flex items-center justify-center"><LoadingSpinner /></div>; }
    if (!video) { return <div className="bg-black text-white min-h-screen flex items-center justify-center"><p>Vídeo não encontrado.</p></div>; }
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
                <button 
                    onClick={() => setShowIntro(false)} 
                    className="absolute bottom-6 right-6 bg-black/50 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-white/20 transition-colors"
                >
                    PULAR INTRO
                </button>
            </div>
        );
    }

return (
    <AnimatedPage>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
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
            
            {/* --- Bloco de Conteúdo Centralizado --- */}
            <div className="max-w-4xl mx-auto"> 
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Coluna Principal da Esquerda */}
                    <div className="md:col-span-2">
                        <h1 className="text-3xl font-bold text-white mb-2">{video.title}</h1>
                        <p className="text-sm text-zinc-400 mb-4">Postado em {new Date(video.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

                    {/* --- NOVA BARRA DE AÇÕES UNIFICADA --- */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4">
                        {/* Bloco do Canal (Avatar, Nome, Inscritos e Botão Seguir) */}
                    <div className="flex items-center gap-4 flex-grow">
                        <Link to={`/parceiro/${video.creator_id.id}`}>
                            <img src={video.creator_id.creatorAvatar || `https://ui-avatars.com/api/?name=${video.creator_id.username.charAt(0)}&background=f1c40f&color=000`} alt={video.creator_id.username} className="w-12 h-12 rounded-full object-cover"/>
                        </Link>
                        <div className="flex-grow">
                            <Link to={`/parceiro/${video.creator_id.id}`} className="font-bold text-white hover:text-[#f1c40f] transition-colors">{video.creator_id.username}</Link>
                            <p className="text-xs text-zinc-400">{subscriberCount.toLocaleString('pt-BR')} seguidores</p>
                        </div>
                        {user?.id !== video.creator_id.id && (
                            <button
                                onClick={handleFollowToggle}
                                disabled={isProcessingFollow}
                                className={`font-semibold px-4 py-2 rounded-lg transition-all duration-200 w-32 text-center text-sm ${isSubscribed ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-white hover:bg-zinc-200 text-black'}`}
                            >
                                {isProcessingFollow ? '...' : (isSubscribed ? 'Inscrito ✓' : 'Inscrever-se')}
                            </button>
                        )}
                    </div>
                        
                        {/* Bloco de Ações do Vídeo (Likes, etc) */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button onClick={handleLikeToggle} disabled={isProcessingLike} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isLiked ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'}`}>
                                {isLiked ? <HeartSolidIcon className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                                <span className="font-semibold text-sm">{likeCount.toLocaleString('pt-BR')}</span>
                            </button>
                            {/* Futuramente, um botão de Compartilhar pode vir aqui */}
                        </div>
                    </div>

                    {/* --- NOVA SEÇÃO DE DESCRIÇÃO --- */}
                            <div className="mt-6">
                                <p className="text-white whitespace-pre-wrap leading-relaxed">
                                    {video.description || 'Nenhuma descrição fornecida.'}
                                </p>
                            </div>
                            <div className="mt-8">
                                <h3 className="text-xl font-bold text-white mb-4">{comments.length} Comentários</h3>
                                {user ? (
                                    <form onSubmit={handleCommentSubmit} className="flex items-start gap-4 mb-8">
                                        {/* ATENÇÃO AQUI: Precisamos buscar o avatar do seu perfil de usuário logado */}
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
                                    {isLoadingComments ? ( <p className="text-zinc-400">Carregando comentários...</p> ) : (
                                        comments.map(comment => (
                                            <div key={comment.id} className="flex items-start gap-4">
                                                <img src={comment.user_id.creatorAvatar || `https://ui-avatars.com/api/?name=${comment.user_id.username.charAt(0)}&background=f1c40f&color=000`} alt={comment.user_id.username} className="w-10 h-10 rounded-full"/>
                                                <div>
                                                    <p className="font-bold text-sm text-white">{comment.user_id.username} <span className="text-xs text-zinc-400 font-normal ml-2">{new Date(comment.created_at).toLocaleDateString('pt-BR')}</span></p>
                                                    <p className="text-zinc-300 mt-1">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="md:col-span-1">
                            <div className="bg-zinc-900 rounded-lg p-4">
                                <h4 className="font-bold text-white mb-3">Próximo</h4>
                                <p className="text-sm text-zinc-400">(Em breve)</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </AnimatedPage>
    );
}