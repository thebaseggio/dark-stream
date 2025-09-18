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
    <div className="relative flex flex-col min-h-screen bg-black text-white overflow-hidden">
      {/* O FUNDO E O FILTRO (OVERLAY) */}
      <div 
        className="absolute inset-0 bg-cover bg-center animate-kenburns"
        style={{ backgroundImage: "url('/landing-bg.jpg')" }}
      ></div>
      <div className="absolute inset-0 bg-black opacity-60"></div>


      {/* 3. O CONTEÚDO (CABEÇALHO E TEXTO PRINCIPAL) */}
      {/* Todo o conteúdo visível fica aqui, com um z-index para garantir que esteja na frente do fundo */}
      <div className="relative z-10 flex flex-col flex-grow">
      <header className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-center">
          {/* LOGO AGORA POSICIONADA IGUAL ÀS OUTRAS PÁGINAS */}
          <Link to="/" title="Voltar para a Home">
              <img src="/LogoT.png" alt="Dark Stream Home" className="h-16 w-auto" />
          </Link>
          
          {/* Botões */}
          <div className="flex items-center gap-2">
              <Link to="/login">
                  <button className="font-semibold px-4 py-2 rounded-md text-white hover:bg-zinc-800 transition-colors text-sm">
                      Entrar
                  </button>
              </Link>
              <Link to="/inscrever-se">
                  <button className="bg-[#f1c40f] hover:bg-opacity-90 text-black font-bold px-4 py-2 rounded-md transition-colors text-sm">
                      Inscrever-se
                  </button>
              </Link>
          </div>
      </header>

        <main className="flex-grow flex items-center justify-center text-center px-4">
          <motion.div
            className="flex flex-col items-center"
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
              <Link to="/casos" className="bg-[#f1c40f] hover:bg-opacity-90 text-black font-bold py-3 px-8 rounded-lg text-lg inline-block transition-transform duration-200 hover:scale-105">
                Investigue Agora
              </Link>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}