import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SeoHead, { DEFAULT_SITE_DESCRIPTION } from '../components/SeoHead';
import SiteContainer from '../components/SiteContainer';
import Footer from '../components/Footer';

const NOISE_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.7 },
  },
};

export default function LandingPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-black text-white">
      <SeoHead title="Dark Stream" description={DEFAULT_SITE_DESCRIPTION} />

      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 -top-32 z-0 h-[600px] w-[600px] animate-siren rounded-full bg-red-600/35 blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 z-0 h-[600px] w-[600px] animate-siren-delayed rounded-full bg-blue-600/30 blur-[100px]" />
        <div className="absolute left-1/2 top-1/2 z-0 h-[350px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/20 blur-[90px]" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(40, 8, 12, 0.35) 0%, rgba(20, 4, 6, 0.12) 40%, transparent 70%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: NOISE_TEXTURE, backgroundSize: '180px 180px' }}
        />
      </div>

      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/5 bg-black/30 backdrop-blur-md">
        <SiteContainer className="flex items-center justify-between py-4">
          <Link to="/" title="Dark Stream" className="transition-opacity hover:opacity-90">
            <img src="/LogoT.png" alt="Dark Stream" className="h-12 w-auto md:h-14" />
          </Link>

          <div className="flex h-10 items-center gap-3">
            <Link to="/login" className="flex h-10 items-stretch">
              <button
                type="button"
                className="box-border flex h-10 cursor-pointer items-center justify-center rounded-none border border-zinc-700/80 bg-black/60 px-5 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-zinc-800 md:text-sm"
              >
                Entrar
              </button>
            </Link>
            <Link to="/inscrever-se" className="flex h-10 items-stretch">
              <button
                type="button"
                className="box-border flex h-10 cursor-pointer items-center justify-center rounded-none border border-amber-500 bg-amber-500 px-5 font-mono text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-amber-400 md:text-sm"
              >
                Inscrever-se
              </button>
            </Link>
          </div>
        </SiteContainer>
      </header>

      <main className="relative z-10 flex min-h-screen flex-col pt-28 md:pt-32">
        <section className="flex flex-grow items-center justify-center px-4 pb-16 pt-8 text-center">
          <SiteContainer>
            <motion.div
              className="relative z-10 mx-auto flex max-w-4xl flex-col items-center"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.p
                className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-amber-500/80"
                variants={itemVariants}
              >
                DARK STREAM · ARQUIVO DE CASOS
              </motion.p>

              <motion.h1
                className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-white md:text-6xl"
                variants={itemVariants}
              >
                Onde a verdade não permanece nas sombras.
              </motion.h1>

              <motion.p
                className="mx-auto mt-6 max-w-xl text-base font-normal leading-relaxed text-zinc-400 md:text-lg"
                variants={itemVariants}
              >
                A primeira plataforma de streaming e investigação interativa dedicada ao True Crime.
              </motion.p>

              <motion.div className="mt-10" variants={itemVariants}>
                <Link
                  to="/casos"
                  className="mx-auto flex h-12 w-fit cursor-pointer items-center justify-center rounded-none border border-amber-500 bg-amber-500 px-8 font-mono text-sm font-bold uppercase tracking-wider text-black shadow-[0_0_30px_rgba(234,179,8,0.25)] transition-all hover:bg-amber-400 md:text-base"
                >
                  INVESTIGUE AGORA
                </Link>
              </motion.div>
            </motion.div>
          </SiteContainer>
        </section>
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
