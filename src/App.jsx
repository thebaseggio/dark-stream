// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { supabase, loadAllVideos } from './supabase';

// Importando nossas peças organizadas
import MainLayout from './pages/MainLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Explore from './pages/Explore';
import VideoPlayer from './pages/VideoPlayer';
import CreatorPanel from './pages/CreatorPanel';
import MyVideos from './pages/MyVideos';

export default function App() {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  function deriveYouTubeThumb(embedUrl) {
     if (!embedUrl) return 'https://placehold.co/480x360?text=No+URL';
     try {
         const url = new URL(embedUrl);
         const videoId = url.pathname.split('/').pop();
         return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
     } catch (error) {
         console.error("URL de embed inválida:", embedUrl);
         return 'https://placehold.co/480x360?text=Invalid+URL';
     }
  }

  useEffect(() => {
    // Checa a sessão do usuário
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Ouve mudanças na autenticação (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Carrega os vídeos
    loadAllVideos()
      .then((data) => {
        const videosWithThumbs = data.map((v) => ({
          ...v,
          thumbnail: v.thumbnail || deriveYouTubeThumb(v.videoUrl),
        }));
        setVideos(videosWithThumbs);
      })
      .catch(console.error);

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Mostra uma tela de loading enquanto verifica a sessão do usuário
  if (loading) {
    return <div className="bg-black text-white min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Rotas que NÃO usam o layout principal */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Rotas que usam o layout principal (com cabeçalho e rodapé) */}
        <Route element={<MainLayout user={user} />}>
          <Route path="/casos" element={<Explore videos={videos} />} />
          <Route path="/video/:id" element={<VideoPlayer />} />
          <Route path="/painel" element={<CreatorPanel user={user} />} />
          <Route path="/meus-videos" element={<MyVideos videos={videos} user={user} />} />
        </Route>

        {/* Rota "catch-all" para páginas não encontradas */}
        <Route path="*" element={<div className="bg-black text-white min-h-screen flex items-center justify-center"><h1>404 - Página Não Encontrada</h1></div>} />
      </Routes>
    </Router>
  );
}