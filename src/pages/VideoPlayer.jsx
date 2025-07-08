import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';

// --- Componente de Animação de Loading ---
function VideoLoadingIntro({ title }) {
    const text = title || "Carregando Dossiê...";
    const sentence = {
        hidden: { opacity: 1 },
        visible: { opacity: 1, transition: { delay: 0.5, staggerChildren: 0.08 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.5 } }
    };
    const letter = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <motion.h1 key={text} className="font-serif text-3xl lg:text-4xl tracking-wider text-center px-4"
                variants={sentence} initial="hidden" animate="visible" exit="exit">
                {text.split("").map((char, index) => (
                    <motion.span key={char + "-" + index} variants={letter}>{char}</motion.span>
                ))}
            </motion.h1>
        </div>
    );
}


export default function VideoPlayer({ user }) {
    const { id } = useParams();
    const [video, setVideo] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    
    // As refs para guardar os players de áudio
    const introSoundRef = useRef(null);
    const ambienceSoundRef = useRef(null);

    // FUNÇÃO DE FADE OUT DO SOM
    const startFadeOut = (audioElement, fadeDuration) => {
        if (!audioElement) return;
        const initialVolume = audioElement.volume;
        const fadeStepTime = 50;
        const numberOfSteps = fadeDuration / fadeStepTime;
        const volumeDecrement = initialVolume / numberOfSteps;
        const fadeInterval = setInterval(() => {
            if (audioElement.volume > volumeDecrement) {
                audioElement.volume -= volumeDecrement;
            } else {
                clearInterval(fadeInterval);
                audioElement.pause();
                audioElement.currentTime = 0;
                audioElement.volume = initialVolume;
            }
        }, fadeStepTime);
    };

    useEffect(() => {
        // Inicializa os objetos de áudio apenas uma vez
        if (!introSoundRef.current) {
            introSoundRef.current = new Audio('/intro-sound3.mp3');
        }
        if (!ambienceSoundRef.current) {
            ambienceSoundRef.current = new Audio('/intro-ambience.mp3');
            ambienceSoundRef.current.loop = true;
            ambienceSoundRef.current.volume = 0.3;
        }

        const fetchVideoAndComments = async () => {
            if (!id) { setLoading(false); setError("ID do vídeo não fornecido."); return; }
            setLoading(true);
            setError('');

            // Toca os sons
            introSoundRef.current.play().catch(e => console.warn("Aviso de áudio:", e.message));
            ambienceSoundRef.current.play().catch(e => console.warn("Aviso de áudio:", e.message));

            const [videoResult, commentsResult] = await Promise.all([
                supabase.from('videos').select('*, creatorId ( id, username, creatorAvatar )').eq('id', id).single(),
                supabase.from('comments').select('*, user_id ( id, username, creatorAvatar )').eq('video_id', id).order('created_at', { ascending: false })
            ]);

            if (videoResult.error || !videoResult.data) {
                console.error("Erro ao buscar o vídeo:", videoResult.error);
                setError("Não foi possível carregar o vídeo.");
                setLoading(false);
                return;
            }
            
            setVideo(videoResult.data);
            setComments(commentsResult.data || []);
            
            const title = videoResult.data.title || "Carregando...";
            const typingDuration = (title.length * 80) + 1000;
            const minIntroTime = 3000;
            const finalDuration = Math.max(typingDuration, minIntroTime);
            const fadeOutDuration = 2500; // Duração de 2s para o fade out

            const fadeTimer = setTimeout(() => {
                startFadeOut(ambienceSoundRef.current, fadeOutDuration);
            }, Math.max(0, finalDuration - fadeOutDuration));
            
            const screenChangeTimer = setTimeout(() => setLoading(false), finalDuration);

            return { fadeTimer, screenChangeTimer };
        };

        let timers;
        fetchVideoAndComments().then(res => timers = res);

        return () => {
            introSoundRef.current?.pause();
            ambienceSoundRef.current?.pause();
            if (timers) {
                clearTimeout(timers.fadeTimer);
                clearTimeout(timers.screenChangeTimer);
            }
        };
    }, [id]);

    if (loading) { return <VideoLoadingIntro title={video?.title} />; }
    if (error || !video) { return <div className="text-center p-10">{error || "Vídeo não encontrado."}</div>; }

    return (
        <AnimatePresence mode="wait">
            {loading ? (
                // Adicionamos uma key para o Framer Motion saber quem está saindo
                <motion.div key="loader">
                    <VideoLoadingIntro title={video?.title} />
                </motion.div>
            ) : error || !video ? (
                // Adicionamos uma key para a tela de erro também
                <motion.div key="error">
                    <div className="text-center p-10">{error || "Vídeo não encontrado."}</div>
                </motion.div>
            ) : (
                // Adicionamos uma key para o conteúdo principal
                <motion.div key="player">
        <AnimatedPage>
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                <div className="lg:col-span-2">
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                        <iframe src={video.videoUrl} title={video.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full rounded-lg shadow-lg"></iframe>
                    </div>

                    <div className="bg-zinc-900 p-6 rounded-lg">
                        <h1 className="text-2xl lg:text-3xl font-bold mb-2">{video.title}</h1>
                        
                        {/* 👇 ATUALIZADO PARA LER OS DADOS DO NOVO FORMATO 👇 */}
                        {video.creatorId && (
                            <Link to={`/parceiro/${video.creatorId.id}`} className="inline-block mb-4">
                                <div className="flex items-center gap-3 group">
                                    <img src={video.creatorId.creatorAvatar || `https://ui-avatars.com/api/?name=${video.creatorId.username?.charAt(0)}`} alt={video.creatorId.username} className="w-10 h-10 rounded-full object-cover transition-transform duration-200 group-hover:scale-110"/>
                                    <p className="text-sm text-gray-300 group-hover:text-white">por <span className="font-bold text-white">{video.creatorId.username}</span></p>
                                </div>
                            </Link>
                        )}
                        
                        <hr className="border-zinc-700 my-4" />
                        <div className="text-gray-400 whitespace-pre-wrap">
                            <p className={!isDescriptionExpanded ? 'line-clamp-3' : ''}>
                                {video.description}
                            </p>
                            <button 
                                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                className="text-[#f1c40f] font-bold hover:underline mt-2"
                            >
                                {isDescriptionExpanded ? 'Ver menos' : '...ver mais'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1 bg-zinc-900 p-6 rounded-lg h-fit">
                    <h2 className="text-xl font-bold mb-4">Comentários ({comments.length})</h2>
                    {user && (
                        <div className="mb-6">
                            <textarea placeholder="Deixe seu comentário..." rows="3" className="w-full p-2 bg-zinc-800 rounded border border-zinc-700 focus:outline-none focus:border-[#f1c40f]"></textarea>
                            <button className="w-full mt-2 bg-[#8e44ad] text-white font-bold py-2 rounded hover:bg-opacity-90">Comentar</button>
                        </div>
                    )}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-zinc-800">
                        {comments.map(comment => (
                            // 👇 ATUALIZADO PARA LER OS DADOS DO NOVO FORMATO 👇
                            <div key={comment.id} className="flex items-start gap-3">
                                {comment.user_id && (
                                    <>
                                        <img src={comment.user_id.creatorAvatar || `https://ui-avatars.com/api/?name=${comment.user_id.username?.charAt(0)}`} alt={comment.user_id.username} className="w-8 h-8 rounded-full mt-1"/>
                                        <div>
                                            <p className="text-sm font-bold">{comment.user_id.username}</p>
                                            <p className="text-sm text-gray-300">{comment.content}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AnimatedPage>
                </motion.div>
            )}
        </AnimatePresence>
    );
}