// src/pages/PartnerPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import AnimatedPage from '../AnimatedPage';

// Reutilizando o componente de Card que já temos
function VideoCard({ video }) {
    const navigate = useNavigate();
    return (
        <div 
            onClick={() => navigate(`/video/${video.id}`)}
            className="bg-black border-2 border-zinc-800 rounded-lg p-3 flex flex-col h-full cursor-pointer group transform transition-transform duration-300 hover:scale-[1.03] hover:border-[#f1c40f]"
        >
            <img src={video.thumbnail || `https://placehold.co/480x360/000000/FFF?text=${video.title}`} alt={video.title} className="rounded-md object-cover w-full h-40 mb-2"/>
            <h2 className="font-anton text-center text-white text-base capitalize tracking-wide leading-snug mt-2 line-clamp-2 flex-grow">
                {video.title}
            </h2>
            <div className="mt-auto flex justify-center gap-2 pt-2">
                <Link to={`/video/${video.id}`} onClick={(e) => e.stopPropagation()} className="bg-[#f1c40f] hover:bg-opacity-90 text-[#040402] font-bold py-2 px-3 rounded text-xs text-center flex-1">
                    🎬 Assistir
                </Link>
            </div>
        </div>
    );
}


export default function PartnerPage() {
    // Pega o 'id' da URL (ex: /parceiro/123-abc)
    const { id } = useParams();

    // Estados para guardar os dados e o status de carregamento
    const [partnerProfile, setPartnerProfile] = useState(null);
    const [partnerVideos, setPartnerVideos] = useState([]);
    const [loading, setLoading] = useState(true);

// Dentro do seu componente PartnerPage

useEffect(() => {
    const fetchPartnerData = async () => {
        if (!id) return;

        setLoading(true);

        // --- CHAMADA ÚNICA E OTIMIZADA ---
        // Pede ao Supabase para trazer o perfil e, junto com ele ('*'),
        // todos os vídeos ('videos(*)') que estão relacionados a ele.
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                videos ( * )
            `)
            .eq('id', id)
            .order('created_at', { referencedTable: 'videos', ascending: false }) // Ordena os vídeos aninhados
            .single();

        if (error) {
            console.error("Erro ao buscar dados do parceiro:", error);
            setPartnerProfile(null); // Garante que nenhum perfil antigo seja mostrado
        } else if (data) {
            // A 'data' agora contém o perfil e um array 'videos' dentro dele
            setPartnerProfile(data);
            setPartnerVideos(data.videos || []);
        }

        setLoading(false);
    };

    fetchPartnerData();
}, [id]);

    if (loading) {
        return <div className="text-center p-10">Carregando perfil do Parceiro...</div>;
    }

    if (!partnerProfile) {
        return <div className="text-center p-10">Parceiro não encontrado.</div>;
    }

    return (
        <AnimatedPage>
            {/* Seção do Banner do Perfil */}
            <div className="bg-zinc-900 rounded-lg p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
                <img 
                    src={partnerProfile.creatorAvatar || `https://ui-avatars.com/api/?name=${partnerProfile.username?.charAt(0)}&background=f1c40f&color=000&size=128`}
                    alt={partnerProfile.username}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-zinc-800"
                />
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-4xl font-bold">{partnerProfile.username}</h1>
                    <p className="text-md text-gray-400 mt-2 max-w-2xl">{partnerProfile.bio || 'Parceiro do Dark Stream dedicado a desvendar os maiores mistérios.'}</p>
                    <button className="mt-4 bg-[#8e44ad] hover:bg-[#803d9c] text-white font-semibold px-6 py-2 rounded-lg transition-colors">
                        Seguir
                    </button>
                </div>
            </div>

            {/* Seção da Grade de Vídeos */}
            <div>
                <h2 className="font-anton text-white text-2xl mb-6 text-left">Vídeos de {partnerProfile.username}</h2>
                {partnerVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-10">
                        {partnerVideos.map(video => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-400">Este parceiro ainda não publicou nenhum vídeo.</p>
                )}
            </div>
        </AnimatedPage>
    );
}