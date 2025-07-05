// src/pages/LandingPage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// As variantes de animação que já criamos
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.7,
    },
  },
};

export default function LandingPage() {
  return (
    // 1. O CONTAINER PRINCIPAL DA PÁGINA
    // Ele agora é relativo para posicionar os filhos absolutos dentro dele.
    <div className="relative flex flex-col min-h-screen bg-black text-white">
      
      {/* 2. O FUNDO E O FILTRO (OVERLAY) */}
      {/* Esta div aplica a imagem de fundo */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('/landing-bg.jpg')" }}
      ></div>
      {/* Esta div cria o filtro escuro por cima da imagem */}
      <div className="absolute inset-0 bg-black opacity-60"></div>


      {/* 3. O CONTEÚDO (CABEÇALHO E TEXTO PRINCIPAL) */}
      {/* Todo o conteúdo visível fica aqui, com um z-index para garantir que esteja na frente do fundo */}
      <div className="relative z-10 flex flex-col flex-grow">
        <header className="w-full p-4">
          <div className="container mx-auto flex justify-between items-center">
            <img src="/logo.png" alt="Dark Stream" className="h-16 w-auto" />
            <div className="flex items-center gap-2">
    <Link to="/login">
        <button className="font-semibold px-4 py-2 rounded-md text-white hover:bg-zinc-800 transition-colors">
            Entrar
        </button>
    </Link>
    <Link to="/inscrever-se">
        <button className="bg-[#f1c40f] hover:bg-opacity-90 text-black font-bold px-4 py-2 rounded-md transition-colors">
            Inscrever-se
        </button>
    </Link>
</div>
          </div>
        </header>

        <main className="flex-grow flex items-center justify-center text-center px-4">
          <motion.div
            className="relative"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1 className="text-5xl md:text-7xl font-bold mb-4" variants={itemVariants}>
              Histórias que precisam ser contadas.
            </motion.h1>
            <motion.p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8" variants={itemVariants}>
              A maior comunidade de criadores e fãs de True Crime do Brasil.
            </motion.p>
            <motion.div variants={itemVariants}>
              <Link to="/casos" className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-black font-bold py-3 px-8 rounded-lg text-lg inline-block transition-transform duration-200 hover:scale-105">
                Comece a Explorar
              </Link>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}