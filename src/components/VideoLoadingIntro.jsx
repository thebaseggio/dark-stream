// src/components/VideoLoadingIntro.jsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoLoadingIntro({ title, onSkip, onIntroEnd }) {
    const [step, setStep] = useState('brand');

    useEffect(() => {
        const stingSound = new Audio('/intro-sound4.mp3');
        stingSound.play().catch(e => console.warn("Aviso de áudio:", e.message));

        const logoTimer = setTimeout(() => {
            setStep('title');
        }, 2500);
        
        const overallTimer = setTimeout(() => {
            onIntroEnd(); // Avisa o componente pai que a intro acabou
        }, 5500); // Duração total da intro

        return () => {
            clearTimeout(logoTimer);
            clearTimeout(overallTimer);
        };
    }, [onIntroEnd]);

    const logoVariants = {
        hidden: { opacity: 0, scale: 0.90 },
        visible: { opacity: 1, scale: 1, transition: { duration: 1.5, ease: "easeInOut" } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.5, ease: "easeOut" } }
    };
    const sentence = { hidden: { opacity: 1 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };
    const letter = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white relative overflow-hidden">
            {step === 'title' && (
                 <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={onSkip}
                    className="absolute top-6 right-6 bg-zinc-800/50 text-white text-xs px-3 py-1 rounded-full hover:bg-zinc-700 transition-colors z-10">
                    Pular Introdução
                </motion.button>
            )}
           
            <AnimatePresence mode="wait">
                {step === 'brand' && (
                    <motion.div key="brand" variants={logoVariants} initial="hidden" animate="visible" exit="exit">
                        <img src="/LogoT.png" alt="Dark Stream Logo" className="w-48 h-auto" />
                    </motion.div>
                )}
                {step === 'title' && (
                    <motion.h1 key="title" className="font-serif text-3xl lg:text-4xl tracking-wider text-center px-4 flex items-center justify-center h-48"
                        variants={sentence} initial="hidden" animate="visible">
                        <div>
                            {(title || "Carregando Dossiê...").split("").map((char, index) => (
                                <motion.span key={char + "-" + index} variants={letter}>{char}</motion.span>
                            ))}
                        </div>
                    </motion.h1>
                )}
            </AnimatePresence>
        </div>
    );
}