import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../AnimatedPage';
import PageTransition from '../components/PageTransition';
import SkeletonCard from './SkeletonCard';
import { Link } from 'react-router-dom';

const categories = [
    { key: 'Nacionais', label: 'Nacionais' }, { key: 'Internacionais', label: 'Internacionais' },
    { key: 'Não solucionados', label: 'Não solucionados' }, { key: 'Solucionados', label: 'Solucionados' },
    { key: 'Serial Killers', label: 'Serial Killers' }, { key: 'Documentários', label: 'Documentários' },
    { key: 'Sobrenaturais', label: 'Sobrenaturais' },
];

function VideoCard({ video, onNavigate }) {
    const videoPath = `/video/${video.id}`; 
    return (
        // O card inteiro agora é um grande botão para o player
        <div onClick={() => onNavigate(videoPath)} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex flex-col h-full group cursor-pointer transition-all duration-300 hover:border-[#f1c40f]/50 hover:shadow-lg hover:shadow-[#f1c40f]/10">
            <div className="block">
                <div className="relative w-full aspect-video mb-3 overflow-hidden rounded-md">
                    <img src={video.thumbnail || `https://placehold.co/480x360/111/FFF?text=IMG`} alt={video.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"/>
                </div>
                <h2 className="font-bold text-sm text-white capitalize leading-snug line-clamp-2 flex-grow group-hover:text-[#f1c40f] transition-colors">{video.title}</h2>
            </div>
            <div className="mt-4 flex justify-end items-center gap-2 pt-3 border-t border-zinc-800">
                {/* O botão 'Assistir' confirma a ação principal */}
                <button onClick={(e) => { 
                    e.stopPropagation(); // Impede que o som toque duas vezes
                    playClickSound(); 
                    onNavigate(videoPath); 
                }} className="bg-[#8e44ad] hover:bg-[#803d9c] text-white font-semibold py-1 px-4 rounded-md text-xs transition-colors">Assistir</button>
            </div>
        </div>
    );
}

export default function Explore({ videos = [] }) {
    const navigate = useNavigate();
    const [isNavigating, setIsNavigating] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleNavigation = (path) => {
        setIsNavigating(true);
        setTimeout(() => { navigate(path); }, 500);
    };

        const playClickSound = () => {
        // O caminho é relativo à pasta 'public'
        const sound = new Audio('/sounds/click.mp3');
        sound.volume = 0.5; // Ajuste o volume se necessário
        sound.play();
    };

    const filteredVideos = videos.filter((v) =>
        (!selectedCategory || v.category === selectedCategory) &&
        (!searchTerm || v.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <AnimatedPage>
            {isNavigating && <PageTransition />}
            <div className="space-y-8">
                        <div onClick={() => {
                playClickSound();
                onNavigate(videoPath);
            }} className="p-4 bg-zinc-900 rounded-lg flex flex-col md:flex-row items-center gap-4">
                    <h3 className="font-semibold flex-shrink-0">Filtros:</h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                            <button key={c.key} onClick={() => setSelectedCategory(prev => prev === c.key ? '' : c.key)} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedCategory === c.key ? 'bg-[#f1c40f] text-black font-bold' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}>
                                {c.label}
                            </button>
                        ))}
                        {selectedCategory && (<button onClick={() => setSelectedCategory('')} className="w-8 h-8 flex items-center justify-center text-sm rounded-full bg-red-600 hover:bg-red-500 text-white font-bold" title="Limpar filtro">&times;</button>)}
                    </div>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por título..." className="w-full md:w-auto md:ml-auto bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded focus:outline-none focus:border-[#f1c40f]"/>
                </div>
                <div>
                    <h2 className="font-anton text-white text-2xl mb-6 text-left">Casos em destaque</h2>
                    {videos.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
                        </div>
                    ) : (
                        filteredVideos.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-10">
                                {filteredVideos.map((video) => (
                                    <VideoCard key={video.id} video={video} onNavigate={handleNavigation} />
                                ))}
                            </div>
                        ) : (
                            <p className="col-span-full text-gray-400 text-center py-10">Nenhum vídeo encontrado para os filtros selecionados.</p>
                        )
                    )}
                </div>
            </div>
        </AnimatedPage>
    );
}