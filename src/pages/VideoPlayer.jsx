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

    // --- A LÓGICA QUE FALTAVA ---
    // Garante que o vídeo saia do mudo se o volume for maior que zero
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
            if (videoError) { console.error("Erro ao buscar vídeo:", videoError); setLoading(false); return; }
            setVideo(videoData);
            setLoading(false);

            setIsLoadingComments(true);
            const { data: commentsData, error: commentsError } = await supabase.from('comments').select('*, user_id (id, username, creatorAvatar)').eq('video_id', videoId).order('created_at', { ascending: false });
            if (commentsError) { console.error("Erro ao buscar comentários:", commentsError); } 
            else { setComments(commentsData); }
            setIsLoadingComments(false);
        };
        fetchData();
    }, [videoId]);

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
                playPromise.catch(error => {
                    console.log("Autoplay bloqueado, aguardando clique do usuário.", error);
                    setIsPlaying(false);
                });
            }
        }
    }, [showIntro]);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (videoElement) {
            const onPlay = () => setIsPlaying(true);
            const onPause = () => setIsPlaying(false);
            const updateProgress = () => { setCurrentTime(videoElement.currentTime); setProgress((videoElement.currentTime / videoElement.duration) * 100 || 0); };
            const setVideoDuration = () => setDuration(videoElement.duration);
            videoElement.addEventListener('play', onPlay);
            videoElement.addEventListener('pause', onPause);
            videoElement.addEventListener('timeupdate', updateProgress);
            videoElement.addEventListener('loadedmetadata', setVideoDuration);
            return () => {
                videoElement.removeEventListener('play', onPlay);
                videoElement.removeEventListener('pause', onPause);
                videoElement.removeEventListener('timeupdate', updateProgress);
                videoElement.removeEventListener('loadedmetadata', setVideoDuration);
            };
        }
    }, [!showIntro]);

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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <h1 className="text-3xl font-bold text-white mb-4">{video.title}</h1>
                        <Link to={`/parceiro/${video.creator_id.id}`} className="inline-flex items-center gap-3 group/creator mb-6">
                           <img src={video.creator_id.creatorAvatar || `https://ui-avatars.com/api/?name=${video.creator_id.username?.charAt(0)}`} alt={video.creator_id.username} className="w-12 h-12 rounded-full object-cover"/>
                           <div><p className="font-bold text-white group-hover/creator:text-[#f1c40f]">{video.creator_id.username}</p></div>
                        </Link>
                        <div className="mt-8">
                            <h3 className="text-xl font-bold text-white mb-4">{comments.length} Comentários</h3>
                            {user ? (
                                <form onSubmit={handleCommentSubmit} className="flex items-start gap-3">
                                    <img src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email?.charAt(0)}`} alt="Seu avatar" className="w-10 h-10 rounded-full"/>
                                    <div className="flex-1">
                                        <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Adicione um comentário..." rows="2" className="w-full bg-zinc-800 border-zinc-700 rounded-md p-2" />
                                        <div className="text-right mt-2">
                                            <button type="submit" disabled={isPostingComment} className="bg-[#f1c40f] text-black font-bold px-4 py-2 rounded-md">
                                                {isPostingComment ? "Enviando..." : "Comentar"}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <p className="text-zinc-400">Você precisa <Link to="/login" className="text-[#f1c40f] hover:underline">fazer login</Link> para comentar.</p>
                            )}
                        </div>
                        <div className="mt-8 space-y-6">
                            {isLoadingComments ? ( <p>Carregando comentários...</p> ) : (
                                comments.map(comment => (
                                    <div key={comment.id} className="flex items-start gap-3">
                                        <img src={comment.user_id.creatorAvatar || `https://ui-avatars.com/api/?name=${comment.user_id.username?.charAt(0)}`} alt={comment.user_id.username} className="w-10 h-10 rounded-full"/>
                                        <div>
                                            <p className="font-bold text-sm text-white">{comment.user_id.username} <span className="text-xs text-zinc-400 font-normal">{new Date(comment.created_at).toLocaleDateString()}</span></p>
                                            <p className="text-zinc-300 mt-1">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="lg:col-span-1"></div>
                </div>
            </div>
        </AnimatedPage>
    );
}