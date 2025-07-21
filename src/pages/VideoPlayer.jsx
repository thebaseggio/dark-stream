// src/pages/VideoPlayer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// --- Ícones SVG para nossos controles (auto-contidos e fáceis de estilizar) ---
const PlayIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg> );
const PauseIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg> );
const VolumeHighIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg> );
const VolumeMuteIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg> );
const FullscreenIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg> );
const BackIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path></svg> );


export default function VideoPlayer() {
    const { id } = useParams();
    const navigate = useNavigate();
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
    const inactivityTimerRef = useRef(null);
    const videoRef = useRef(null);
    const playerContainerRef = useRef(null);
    const [introStep, setIntroStep] = useState(1);
    const [fadeOutFirstPart, setFadeOutFirstPart] = useState(false);
    const [fadeOutSecondPart, setFadeOutSecondPart] = useState(false);
    const LoadingSpinner = () => (
    <div className="w-12 h-12 border-4 border-zinc-700 border-t-[#f1c40f] rounded-full animate-spin"></div>
);

    const handleActivity = () => {
        // Para depuração: Verifique se o evento está sendo disparado
        // console.log('Mouse activity detected!'); 
        
        setAreControlsVisible(true);
        if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
        }
        inactivityTimerRef.current = setTimeout(() => {
            // Apenas esconde os controles se o vídeo não estiver pausado
            if (videoRef.current && !videoRef.current.paused) {
                 setAreControlsVisible(false);
            }
        }, 3000);
    };

    useEffect(() => {
        if (!loading && video) {
            // Timer para iniciar o fade-out da primeira parte
            const fadeOutFirstPartTimer = setTimeout(() => setFadeOutFirstPart(true), 3500);
            // Timer para mudar para a segunda parte da intro
            const stepTimer = setTimeout(() => setIntroStep(2), 4000);
            // Timer para iniciar o fade-out da segunda parte
            const fadeOutSecondPartTimer = setTimeout(() => setFadeOutSecondPart(true), 7500);
            // Timer para a intro completa e início do vídeo
            const introTimer = setTimeout(() => setShowIntro(false), 8000);

        // Limpeza dos timers
        return () => {
            clearTimeout(stepTimer);
            clearTimeout(introTimer);
        };
    }
}, [loading, video]);

useEffect(() => {
    // Quando 'showIntro' se torna 'false', significa que o vídeo ACABOU de ser renderizado.
    // Este é o momento perfeito para dar o play.
    if (showIntro === false && videoRef.current) {
        videoRef.current.play().catch(error => {
            console.log("O Autoplay foi prevenido pelo navegador.", error);
        });
    }
}, [showIntro]); // A dependência na mudança de 'showIntro' é a chave!

    useEffect(() => {
        const fetchVideo = async () => {
            // Garante que o estado de loading seja ativado para cada nova busca
            setLoading(true);

            if (!id) {
                setLoading(false);
                return;
            }

            // A busca no Supabase que estava faltando
            const { data, error } = await supabase
                .from('videos')
                // GARANTA QUE ESTA PARTE ESTÁ AQUI
                .select('*, creator_id ( username )') 
                .eq('id', id)
                .single();

            if (error) {
                console.error("Erro ao buscar o vídeo:", error.message);
                setVideo(null); // Garante que o estado 'video' fique nulo em caso de erro
            } else {
                setVideo(data);
            }

            // Finaliza o loading APÓS a tentativa de busca (sucesso ou falha)
            setLoading(false);
        };

        fetchVideo();
    }, [id]); // A dependência no 'id' da URL está correta

    // --- Funções para controlar o vídeo ---
    const togglePlayPause = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
        } else {
            videoRef.current.pause();
        }
        setIsPlaying(!videoRef.current.paused);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(!isMuted);
    };

    const handleProgressChange = (e) => {
        const newTime = parseFloat(e.target.value);
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            playerContainerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(timeInSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    // --- Efeitos para sincronizar o estado do React com o estado do vídeo ---
    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        const updateProgress = () => {
            setCurrentTime(videoElement.currentTime);
            setProgress((videoElement.currentTime / videoElement.duration) * 100);
        };
        const setVideoDuration = () => setDuration(videoElement.duration);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        videoElement.addEventListener('timeupdate', updateProgress);
        videoElement.addEventListener('loadedmetadata', setVideoDuration);
        videoElement.addEventListener('play', onPlay);
        videoElement.addEventListener('pause', onPause);

        // Limpeza dos listeners
        return () => {
            videoElement.removeEventListener('timeupdate', updateProgress);
            videoElement.removeEventListener('loadedmetadata', setVideoDuration);
            videoElement.removeEventListener('play', onPlay);
            videoElement.removeEventListener('pause', onPause);
        };
}, [!showIntro]); // Roda quando o vídeo é carregado

    if (loading) {
        return <div className="bg-black w-full h-full fixed inset-0 flex items-center justify-center z-50"><LoadingSpinner /></div>;
    }

    if (!video) {
        return <div className="bg-black w-full h-full fixed inset-0 flex items-center justify-center z-50"><p className="text-white font-bold">Vídeo não encontrado.</p></div>;
    }
    
    if (showIntro) {
        return (
            <div className="bg-black w-full h-full fixed inset-0 flex items-center justify-center z-50 overflow-hidden">
                {introStep === 1 ? (
                    // PARTE 1: Nomes (Estilo padronizado e animação de saída)
                    <div className={`text-center text-white p-4 animate-fade-in ${fadeOutFirstPart ? 'animate-fade-out' : ''}`}>
                        <p className="text-3xl font-anton text-gray-300" style={{ textShadow: '0 0 10px rgba(0,0,0,0.7)' }}>
                            Dark Stream & <span className="text-[#f1c40f]">{video.creator_id?.username || 'Criador'}</span>
                        </p>
                        <p className="text-xl text-gray-300 mt-1" style={{ textShadow: '0 0 10px rgba(0,0,0,0.7)' }}>
                            apresentam:
                        </p>
                    </div>
                ) : (
                    // PARTE 2: Título do Caso (Animação de saída)
                    <div className={`text-center text-white p-4 animate-fade-in ${fadeOutSecondPart ? 'animate-fade-out' : ''}`}>
                        <h1 className="text-4xl md:text-6xl font-anton" style={{ textShadow: '0 0 15px rgba(241,196,15,0.3)' }}>
                            {video.title}
                        </h1>
                    </div>
                )}
            </div>
        );
    }

    // O JSX principal SÓ será renderizado se 'loading' for false E 'video' tiver dados.
    return (
        <div ref={playerContainerRef} className={`bg-black w-full h-full fixed inset-0 flex items-center justify-center z-50 animate-fade-in ${!areControlsVisible && !videoRef.current?.paused ? 'cursor-none' : ''}`} onMouseMove={handleActivity} onMouseLeave={() => setAreControlsVisible(false)} onTouchStart={handleActivity}>
            <video
            ref={videoRef}
            onClick={togglePlayPause}
            onDoubleClick={toggleFullScreen}
            className="w-full h-full object-cover"
            src={video.videoUrl}
             />

            <div className={`absolute top-0 left-0 right-0 p-4 lg:p-6 flex items-center gap-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${areControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                <button onClick={() => navigate(-1)} className="text-white hover:bg-white/20 rounded-full p-2 transition-colors" title="Voltar">
                    <BackIcon className="w-6 h-6" />
                </button>
                <h1 className="text-white text-xl font-bold truncate" style={{ textShadow: '0px 1px 5px rgba(0,0,0,0.5)' }}>
                    {video.title}
                </h1>
            </div>
            
            {/* --- NOSSOS NOVOS CONTROLES CUSTOMIZADOS --- */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${areControlsVisible ? 'opacity-100' : 'opacity-0'}`}>

                {/* Barra de Progresso */}
                <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleProgressChange}
                    className="w-full h-1.5 custom-range"
                />

                {/* Linha de Baixo dos Controles */}
                <div className="flex items-center justify-between mt-2 text-white">
                    <div className="flex items-center gap-4">
                        <button onClick={togglePlayPause} className="w-6 h-6">
                            {isPlaying ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <div className="flex items-center gap-2">
                           <button onClick={toggleMute} className="w-6 h-6">
                                {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}
                           </button>
                           <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-24 h-1 custom-range"
                           />
                        </div>
                        <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                    <button onClick={toggleFullScreen} className="w-6 h-6">
                        <FullscreenIcon />
                    </button>
                </div>
            </div>
        </div>
    );
}