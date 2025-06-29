import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SkeletonCard from './SkeletonCard'; // Vamos criar este componente a seguir
import AnimatedPage from './AnimatedPage';

// É uma boa prática ter os dados de categorias aqui, perto de onde são usados.
const categories = [
    { key: 'Nacionais', label: 'Nacionais' },
    { key: 'Internacionais', label: 'Internacionais' },
    { key: 'Não solucionados', label: 'Não solucionados' },
    { key: 'Solucionados', label: 'Solucionados' },
    { key: 'Serial Killers', label: 'Serial Killers' },
    { key: 'Documentários', label: 'Documentários' },
    { key: 'Sobrenaturais', label: 'Sobrenaturais' },
];

export default function Explore({ videos }) {
    const navigate = useNavigate();

    // 1. ESTADOS PARA CONTROLAR A INTERATIVIDADE
    // Estes estados agora vivem aqui, pois pertencem apenas a esta página.
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [rotatedCards, setRotatedCards] = useState({});

    // 2. FUNÇÕES DE MANIPULAÇÃO (Handlers)
    const toggleCardRotation = (id) => {
        setRotatedCards((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCategoryFilter = (category) => {
        setSelectedCategory((prev) => (prev === category ? '' : category));
    };

    // 3. LÓGICA DE FILTRAGEM
    // Filtramos os vídeos com base nos estados atuais antes de exibi-los.
    const filteredVideos = videos.filter((v) =>
        (!selectedCategory || v.category === selectedCategory) &&
        (!searchTerm ||
            v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.creatorName?.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
      <AnimatedPage>
        <div>
            {/* 4. UI DE FILTROS E BUSCA */}
            <div className="mb-8 p-4 bg-zinc-900 rounded-lg">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <h3 className="text-lg font-semibold text-gray-300">Filtros:</h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((c) => (
                            <button key={c.key} onClick={() => handleCategoryFilter(c.key)} className={`px-3 py-1 text-sm rounded-full transition-colors ${selectedCategory === c.key ? 'bg-[#f1c40f] text-black font-bold' : 'bg-zinc-700 hover:bg-zinc-600 text-white'}`}>
                                {c.label}
                            </button>
                        ))}
                        {selectedCategory && (
                            <button onClick={() => setSelectedCategory('')} className="px-3 py-1 text-sm rounded-full bg-red-600 hover:bg-red-500 text-white font-bold" title="Limpar filtro">&times;</button>
                        )}
                    </div>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar por título..." className="flex-grow sm:flex-grow-0 sm:ml-auto bg-zinc-800 border border-zinc-700 text-white px-3 py-1.5 rounded w-full sm:w-64 focus:outline-none focus:border-[#f1c40f] transition duration-200"/>
                </div>
            </div>

            {/* 5. GRID DE VÍDEOS */}
            <h2 className="font-anton text-white text-2xl mb-6 text-left">
            Casos em destaque
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 pb-10">
                {videos.length === 0 ? (
                    // Mostra esqueletos de loading se os vídeos ainda não carregaram
                    Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    // Mostra os vídeos filtrados
                    filteredVideos.map((video) => (
                        <div key={video.id} className="transform transition-transform duration-300 group hover:scale-[1.03] perspective-[1000px]">
                            <div className={`relative w-full max-w-[280px] mx-auto min-h-[320px] transition-transform duration-500 [transform-style:preserve-3d] ${rotatedCards[video.id] ? '[transform:rotateY(180deg)]' : ''}`}>
                                
                                {/* Frente do Card */}
                                <div className="absolute inset-0 bg-black border-2 border-[#f1c40f] rounded-lg p-3 flex flex-col justify-between h-full [backface-visibility:hidden]" style={{ cursor: 'pointer' }} onClick={(e) => { if (!e.target.closest('button, a')) navigate(`/video/${video.id}`); }}>
                                    <img src={video.thumbnail} alt={video.title} className="rounded-md object-cover w-full h-40 mb-2"/>
                                    <h2 className="font-anton text-center text-white text-base capitalize tracking-wide leading-snug mt-2 line-clamp-2 flex-grow">
                                        {video.title}
                                    </h2>
                                    <div className="mt-auto flex justify-between gap-2 pt-2">
                                        <Link to={`/video/${video.id}`} className="bg-[#f1c40f] hover:bg-[#f1c40f]/90 text-[#040402] font-bold py-2 px-3 rounded text-xs text-center flex-1">
                                            🎬 Assistir
                                        </Link>
                                        <button onClick={(e) => { e.stopPropagation(); toggleCardRotation(video.id); }} className="bg-gray-700 hover:bg-gray-600/90 font-semibold py-2 px-3 rounded text-xs text-center flex-1">
                                            ℹ️ Mais Info
                                        </button>
                                    </div>
                                </div>

                                {/* Verso do Card (ainda não implementado, mas a estrutura está aqui) */}
                                <div className="absolute inset-0 bg-zinc-900 border-2 border-[#f1c40f] rounded-lg p-4 flex flex-col justify-between [transform:rotateY(180deg)] [backface-visibility:hidden]">
                                    <div className="text-center">
                                        <h3 className="font-bold mb-2">{video.title}</h3>
                                        <p className="text-sm">Categoria: {video.category}</p>
                                        {/* Você pode adicionar mais detalhes aqui */}
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); toggleCardRotation(video.id); }} className="mt-auto bg-gray-700 hover:bg-gray-600/90 font-semibold py-2 px-3 rounded text-xs w-full">
                                        🠔 Voltar
                                    </button>
                                </div>

                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
        </AnimatedPage>
    );
}