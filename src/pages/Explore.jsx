// src/pages/Explore.jsx

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import PageTransition from '../components/PageTransition';
import SkeletonCard from './SkeletonCard';

const categories = [
    { key: 'Nacionais', label: 'Nacionais' }, { key: 'Internacionais', label: 'Internacionais' },
    { key: 'Não solucionados', label: 'Não solucionados' }, { key: 'Solucionados', label: 'Solucionados' },
    { key: 'Serial Killers', label: 'Serial Killers' }, { key: 'Documentários', label: 'Documentários' },
    { key: 'Sobrenaturais', label: 'Sobrenaturais' },
];

function VideoCard({ video, onCardClick, isRotated, onInfoClick }) {
    return (
        <div className="transform transition-transform duration-300 group hover:scale-[1.03] perspective-[1000px]">
            <div className={`relative w-full max-w-[280px] mx-auto min-h-[320px] transition-transform duration-500 [transform-style:preserve-3d] ${isRotated ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 bg-black border-2 border-[#f1c40f] rounded-lg p-3 flex flex-col justify-between h-full [backface-visibility:hidden] cursor-pointer" onClick={() => onCardClick(video.id)}>
                    <img src={video.thumbnail || `https://placehold.co/480x360/000000/FFF?text=IMG`} alt={video.title} className="rounded-md object-cover w-full h-40 mb-2"/>
                    <h2 className="font-anton text-center text-white text-base capitalize tracking-wide leading-snug mt-2 line-clamp-2 flex-grow">{video.title}</h2>
                    <div className="mt-auto flex justify-between gap-2 pt-2">
                        <button className="bg-[#f1c40f] hover:bg-opacity-90 text-[#040402] font-bold py-2 px-3 rounded text-xs text-center flex-1">🎬 Assistir</button>
                        <button onClick={(e) => { e.stopPropagation(); onInfoClick(); }} className="bg-gray-700 hover:bg-gray-600 font-semibold py-2 px-3 rounded text-xs text-center flex-1">ℹ️ Mais Info</button>
                    </div>
                </div>
                <div className="absolute inset-0 bg-zinc-900 border-2 border-[#f1c40f] rounded-lg p-4 flex flex-col [transform:rotateY(180deg)] [backface-visibility:hidden] text-left">
                    <Link to={`/parceiro/${video.creatorId}`} onClick={(e) => e.stopPropagation()} className="block mb-2 p-2 bg-black rounded-lg hover:bg-zinc-800 transition-colors">
                        <div className="flex items-center gap-3">
                            <img src={video.creatorAvatar || 'https://placehold.co/40x40/000000/FFF?text=DS'} alt={video.creatorName} className="w-10 h-10 rounded-full object-cover"/>
                            <div>
                                <p className="text-xs text-gray-400">Criado por</p>
                                <p className="text-white font-bold">{video.creatorName || 'Anônimo'}</p>
                            </div>
                        </div>
                    </Link>
                    <hr className="border-zinc-700 my-2" />
                    <div className="flex-grow overflow-y-auto pr-1 text-xs space-y-1 text-gray-300">
                        <p><strong>📂 Categoria:</strong> {video.category}</p>
                        <p><strong>🏷️ Tags:</strong> {video.tags ? (Array.isArray(video.tags) ? video.tags.join(', ') : video.tags) : 'Nenhuma'}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onInfoClick(); }} title="Voltar" className="mt-auto w-full bg-gray-700 hover:bg-gray-600 font-semibold py-2 rounded text-xs">🠔 Voltar</button>
                </div>
            </div>
        </div>
    );
}

export default function Explore({ videos = [] }) {
    const navigate = useNavigate();
    const [isNavigating, setIsNavigating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [rotatedCards, setRotatedCards] = useState({});

    const handleCardClick = (videoId) => {
        setIsNavigating(true);
        setTimeout(() => { navigate(`/video/${videoId}`); }, 500);
    };

    const toggleCardRotation = (id) => {
        setRotatedCards(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const filteredVideos = videos
        .filter((v) =>
            (!selectedCategory || v.category === selectedCategory) &&
            (!searchTerm || v.title.toLowerCase().includes(searchTerm.toLowerCase()))
        )
        .map(video => ({
            ...video,
            isRotated: rotatedCards[video.id] || false
        }));

    return (
        <AnimatedPage>
            {isNavigating && <PageTransition />}
            <div className="space-y-8">
                {/* UI DE FILTROS E BUSCA */}
                <div className="p-4 bg-zinc-900 rounded-lg flex flex-col md:flex-row items-center gap-4">
                    <h3 className="font-semibold flex-shrink-0">Filtros:</h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                            <button 
                                key={c.key} 
                                onClick={() => setSelectedCategory(prev => prev === c.key ? '' : c.key)} 
                                className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedCategory === c.key ? 'bg-[#f1c40f] text-black font-bold' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}
                            >
                                {c.label}
                            </button>
                        ))}
                        {selectedCategory && (<button onClick={() => setSelectedCategory('')} className="w-8 h-8 flex items-center justify-center text-sm rounded-full bg-red-600 hover:bg-red-500 text-white font-bold" title="Limpar filtro">&times;</button>)}
                    </div>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por título..." className="w-full md:w-auto md:ml-auto bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded focus:outline-none focus:border-[#f1c40f]"/>
                </div>

                {/* GRID DE VÍDEOS */}
                <div>
                    <h2 className="font-anton text-white text-2xl mb-6 text-left">Casos em destaque</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                        {videos.length === 0 ? (
                            Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                        ) : (
                            filteredVideos.length > 0 ? (
                                filteredVideos.map((video) => (
                                    <VideoCard 
                                        key={video.id} 
                                        video={video} 
                                        onCardClick={handleCardClick}
                                        isRotated={video.isRotated}
                                        onInfoClick={() => toggleCardRotation(video.id)} 
                                    />
                                ))
                            ) : (
                                <p className="col-span-full text-gray-400 text-center py-10">Nenhum vídeo encontrado para os filtros selecionados.</p>
                            )
                        )}
                    </div>
                </div>
            </div>
        </AnimatedPage>
    );
}