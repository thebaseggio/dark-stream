// src/components/CategoryRow.jsx

import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function MiniVideoCard({ video, onNavigate }) {
    return (
        <div onClick={() => onNavigate(`/video/${video.id}`)} className="flex-shrink-0 w-64 group cursor-pointer">
            <div className="relative w-full aspect-video overflow-hidden rounded-md bg-zinc-800">
                <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
            </div>
            <h3 className="mt-2 text-sm text-white font-semibold uppercase h-10 group-hover:text-[#f1c40f]">
                {video.title}
            </h3>
        </div>
    );
}

export default function CategoryRow({ title, videos, onNavigate }) {
    const scrollContainerRef = useRef(null);
    // ✨ NOVO ESTADO para controlar a visibilidade das setas ✨
    const [showScroll, setShowScroll] = useState(false);

    // ✨ NOVA LÓGICA para verificar se a rolagem é necessária ✨
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const checkScroll = () => {
            // Mostra as setas apenas se a largura do conteúdo for maior que a largura visível
            if (container.scrollWidth > container.clientWidth) {
                setShowScroll(true);
            } else {
                setShowScroll(false);
            }
        };

        checkScroll(); // Verifica na montagem inicial

        // Usa ResizeObserver para verificar novamente se o tamanho da janela mudar
        const resizeObserver = new ResizeObserver(checkScroll);
        resizeObserver.observe(container);

        // Limpa o observer quando o componente é desmontado
        return () => resizeObserver.unobserve(container);
    }, [videos]); // Roda novamente se a lista de vídeos mudar

    if (!videos || videos.length === 0) return null;

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="group/row space-y-4 relative mb-12">
            <div onClick={() => onNavigate(`/categoria/${encodeURIComponent(title)}`)} className="cursor-pointer">
                <h2 className="font-anton text-white text-2xl hover:text-[#f1c40f] transition-colors inline-block">{title}</h2>
            </div>
            
            <button 
                onClick={() => scroll('left')} 
                className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 z-10 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover/row:opacity-100 transition-all hover:bg-[#f1c40f] hover:text-black disabled:opacity-0"
            >
                &lt;
            </button>
            <button 
                onClick={() => scroll('right')} 
                className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 z-10 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover/row:opacity-100 transition-all hover:bg-[#f1c40f] hover:text-black"
            >
                &gt;
            </button>

            <div ref={scrollContainerRef} className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                {videos.map(video => <MiniVideoCard key={video.id} video={video} onNavigate={onNavigate} />)}
            </div>
        </div>
    );
}