// src/components/CategoryRow.jsx (VERSÃO COMPLETA E CORRIGIDA)

import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// -- ALTERAÇÃO 1: Adicionamos a prop 'variant' aqui --
function MiniVideoCard({ video, onNavigate, variant }) {
    if (variant === 'short') {
        return (
            <div onClick={() => onNavigate(`/video/${video.id}`)} className="flex-shrink-0 w-40 group cursor-pointer">
                <div className="relative w-full aspect-[9/16] overflow-hidden rounded-md bg-zinc-800">
                    <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-md"></div>
                    
                    {/* --- BLOCO DE CÓDIGO FINAL PARA TODOS OS SELOS --- */}
                    {video.short_type === 'update' && (
                        <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">UPDATE</span>
                    )}
                    {video.short_type === 'intro' && (
                        <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">PRÉVIA</span>
                    )}
                    {/* --- NOVO SELO ADICIONADO --- */}
                    {video.short_type === 'flash' && (
                        <span className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">FLASH</span>
                    )}
                    
                    <h3 className="absolute bottom-2 left-2 right-2 text-sm text-white font-semibold uppercase line-clamp-2 group-hover:text-[#f1c40f]">
                        {video.title}
                    </h3>
                </div>
            </div>
        );
    }

    // Caso contrário, renderizamos o card padrão que você já tinha
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


// -- ALTERAÇÃO 2: Adicionamos a prop 'variant' aqui também --
export default function CategoryRow({ title, videos, onNavigate, variant }) {
    const scrollContainerRef = useRef(null);
    const [showScroll, setShowScroll] = useState(false);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const checkScroll = () => {
            if (container.scrollWidth > container.clientWidth) {
                setShowScroll(true);
            } else {
                setShowScroll(false);
            }
        };
        checkScroll();
        const resizeObserver = new ResizeObserver(checkScroll);
        resizeObserver.observe(container);
        return () => resizeObserver.unobserve(container);
    }, [videos]);

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
                {/* -- ALTERAÇÃO 3: Passamos a prop 'variant' para o MiniVideoCard -- */}
                {videos.map(video => <MiniVideoCard key={video.id} video={video} onNavigate={onNavigate} variant={variant} />)}
            </div>
        </div>
    );
}