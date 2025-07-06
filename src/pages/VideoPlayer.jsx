// src/pages/VideoPlayer.jsx

import React, { useState, useEffect, useRef } from 'react'; // Importamos o useRef
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';
import { motion } from 'framer-motion';


// No topo do seu VideoPlayer.jsx

function VideoLoadingIntro({ title }) {
    const text = title || "Carregando Dossiê...";

    // Variantes da animação para o Framer Motion
    const sentence = {
        hidden: { opacity: 1 },
        visible: {
            opacity: 1,
            transition: {
                delay: 0.5,
                staggerChildren: 0.08, // Tempo entre cada letra aparecer
            },
        },
        exit: { // Nova animação de saída
            opacity: 0,
            y: -20,
            transition: { duration: 0.5 }
        }
    };
    const letter = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    const introSoundRef = useRef(null);
    const ambienceSoundRef = useRef(null);

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <motion.h1 
                key={text}
                className="font-serif text-3xl lg:text-4xl tracking-wider text-center px-4"
                variants={sentence}
                initial="hidden"
                animate="visible"
                exit="exit" // Ativa a animação de saída
            >
                {text.split("").map((char, index) => (
                    <motion.span key={char + "-" + index} variants={letter}>
                        {char}
                    </motion.span>
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

useEffect(() => {
    const fetchVideoAndComments = async () => {
        if (!id) {
            setLoading(false);
            setError("ID do vídeo não fornecido.");
            return;
        }
        
        setLoading(true);
        setError('');

        // Toca o som de introdução imediatamente
        const sound = new Audio('/audio1.mp3');
        sound.play().catch(e => console.error("Erro ao tocar o som:", e));

        // Busca os dados do vídeo e comentários
        const [videoResult, commentsResult] = await Promise.all([
            supabase.from('videos').select('*, creatorId ( id, username, creatorAvatar )').eq('id', id).single(),
            supabase.from('comments').select('*, user_id ( id, username, creatorAvatar )').eq('video_id', id).order('created_at', { ascending: false })
        ]);

        // Se a busca pelo vídeo principal falhar, paramos aqui.
        if (videoResult.error || !videoResult.data) {
            console.error("Erro ao buscar o vídeo:", videoResult.error);
            setError("Não foi possível carregar o vídeo.");
            setLoading(false);
            return;
        }
        
        // Se a busca deu certo, atualizamos o estado do vídeo
        setVideo(videoResult.data);
        // E também dos comentários
        setComments(commentsResult.data || []);

        // 👇 A LÓGICA DE TEMPO DINÂMICO ACONTECE AQUI 👇

        // 1. Pegamos o título do vídeo que acabamos de receber
        const title = videoResult.data.title || "Carregando Dossiê...";

        // 2. Definimos nossas variáveis de tempo em milissegundos
        const timePerChar = 80; // 80ms por letra (equivale ao staggerChildren de 0.08s)
        const baseDelay = 1000; // 1s de atraso base para o som começar e a animação engrenar
        
        // 3. Calculamos a duração total da animação do título
        const typingDuration = (title.length * timePerChar) + baseDelay;
        
        // 4. Definimos um tempo mínimo para a introdução (a duração do seu som)
        const minIntroTime = 3000; // 3 segundos

        // 5. A duração final será o MAIOR valor entre o tempo de digitação e o tempo mínimo
        const finalDuration = Math.max(typingDuration, minIntroTime);
        
        // 6. Usamos essa duração final no nosso timer
        setTimeout(() => setLoading(false), finalDuration);
    };

    fetchVideoAndComments();
}, [id]);
 
    if (loading) {
        return <VideoLoadingIntro title={video?.title} />;
    }

    if (error || !video) {
        return <div className="text-center p-10">{error || "Vídeo não encontrado."}</div>;
    }

    return (
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
    );
}