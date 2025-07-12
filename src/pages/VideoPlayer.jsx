// src/pages/VideoPlayer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';

// --- Componente de Animação de Loading ("Cut-scene") ---
function VideoLoadingIntro({ videoTitle, onIntroEnd, onSkip }) {
    const [step, setStep] = useState('brand'); // Controla a etapa da animação: 'brand' ou 'title'

    useEffect(() => {
        // Toca o som de impacto inicial
        const stingSound = new Audio('/intro-sound.mp3');
        stingSound.play().catch(e => console.warn("Aviso:", e.message));

        // Timer para trocar da logo para o título
        const titleTimer = setTimeout(() => {
            setStep('title');
        }, 2500); // Mostra a logo por 2.5 segundos

        // Timer para finalizar toda a introdução
        const endTimer = setTimeout(() => {
            onIntroEnd(); // Avisa o componente pai que a intro acabou
        }, 6000); // Duração total da intro: 6 segundos

        return () => {
            clearTimeout(titleTimer);
            clearTimeout(endTimer);
        };
    }, [onIntroEnd]);

    const logoVariants = {
        hidden: { opacity: 0, scale: 0.9 },
        visible: { opacity: 1, scale: 1, transition: { duration: 1.5, ease: "easeInOut" } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.5, ease: "easeOut" } }
    };
    const sentence = { visible: { transition: { staggerChildren: 0.08 } } };
    const letter = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
            <button onClick={onSkip} className="absolute top-6 right-6 bg-zinc-800/50 text-white text-xs px-3 py-1 rounded-full hover:bg-zinc-700 transition-colors z-10">
                Pular Introdução
            </button>
            <AnimatePresence mode="wait">
                {step === 'brand' && (
                    <motion.div key="brand" variants={logoVariants} initial="hidden" animate="visible" exit="exit">
                        <img src="/LogoT.png" alt="Dark Stream Logo" className="w-48 h-auto" />
                    </motion.div>
                )}
                {step === 'title' && (
                    <motion.h1 key="title" className="font-serif text-3xl lg:text-4xl tracking-wider text-center px-4"
                        variants={sentence} initial="hidden" animate="visible">
                        {(videoTitle || "Carregando Dossiê...").split("").map((char, index) => (
                            <motion.span key={char + "-" + index} variants={letter}>{char}</motion.span>
                        ))}
                    </motion.h1>
                )}
            </AnimatePresence>
        </div>
    );
}


// --- Componente Principal da Página ---
export default function VideoPlayer() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchVideoUrl = async () => {
            if (!id) { setLoading(false); return; }
            const { data, error } = await supabase
                .from('videos')
                .select('videoUrl, title')
                .eq('id', id)
                .single();
            
            if (error || !data) {
                console.error("Vídeo não encontrado:", error);
                navigate('/404');
            } else {
                setVideo(data);
            }
        };
        fetchVideoUrl();
    }, [id, navigate]);

    if (loading) {
        return <VideoLoadingIntro onIntroEnd={() => setLoading(false)} onSkip={() => setLoading(false)} videoTitle={video?.title} />;
    }

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-40 p-4">
             <button onClick={() => navigate(-1)} className="absolute top-5 right-5 text-white text-3xl hover:opacity-70 transition-opacity z-50 p-2" title="Voltar">&times;</button>
            
             {/* 👇 A SOLUÇÃO DEFINITIVA PARA A PROPORÇÃO 16:9 👇 */}
             <div className="relative w-full max-w-screen-lg" style={{ paddingTop: '56.25%' }}>
                <iframe 
                    src={`${video.videoUrl}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`} 
                    title={video.title}
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                    allowFullScreen
                ></iframe>
            </div>
        </div>
    );
}