// src/pages/Explore.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadAllVideos } from '../supabase';

const TAGS = [
  { key: 'crimes-passionais', label: '💔 Crimes Passionais' },
  { key: 'justica-questionavel', label: '⚖️ Justiça Questionável' },
  { key: 'vitimas-infantis', label: '👶 Vítimas Infantis' },
  { key: 'perfil-psicologico', label: '🧠 Perfil Psicológico' },
  { key: 'casos-em-andamento', label: '🚨 Casos em Andamento' },
  { key: 'casos-internacionais', label: '🌍 Casos Internacionais' },
  { key: 'casos-no-brasil', label: '📍 Casos no Brasil' },
  { key: 'serial-killers-famosos', label: '🔪 Serial Killers Famosos' },
  { key: 'baseado-em-fatos-reais', label: '🎬 Baseado em Fatos Reais' },
  { key: 'adaptados-para-o-cinema', label: '📽️ Adaptados para o Cinema' },
];

export default function Explore() {
  const [videosByTag, setVideosByTag] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchVideos() {
      const allVideos = await loadAllVideos();
      const grouped = {};
      for (const tag of TAGS) {
        grouped[tag.key] = allVideos.filter(video =>
          video.tags && video.tags.includes(tag.key)
        );
      }
      setVideosByTag(grouped);
    }
    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white px-6 py-8">
      <h1 className="text-3xl font-bold mb-2">Explorar por temas</h1>
      <p className="text-gray-400 mb-8">Descubra casos por tópicos que mais te interessam</p>

      {TAGS.map(({ key, label }) => (
        videosByTag[key] && videosByTag[key].length > 0 && (
          <div key={key} className="mb-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">
                <span className="text-[#9c27b0]">{label}</span>
              </h2>
              <button
                onClick={() => navigate(`/tags/${key}`)}
                className="text-sm text-[#9c27b0] hover:underline"
              >
                ➜ Ver todos
              </button>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
              {videosByTag[key].map((video) => (
                <div
                  key={video.id}
                  className="min-w-[200px] max-w-[200px] bg-zinc-900 rounded-lg overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-36 object-cover"
                  />
                  <div className="p-2">
                    <h3 className="text-sm font-semibold line-clamp-2">
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}
