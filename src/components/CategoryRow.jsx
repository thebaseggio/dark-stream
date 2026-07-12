// src/components/CategoryRow.jsx (VERSÃO COMPLETA E CORRIGIDA)

import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// -- ALTERAÇÃO 1: Adicionamos a prop 'variant' aqui --
function MiniVideoCard({ video, onNavigate, variant }) {
    if (variant === 'short') {
        return (
            <div onClick={() => onNavigate(`/video/${video.id}`)} className="flex-shrink-0 w-40 group cursor-pointer">
                <div className="relative w-full aspect-[9/16] overflow-hidden border border-dark-border bg-dark-panel">
                    <img 
                        src={video.thumbnail} 
                        alt={video.title} 
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    
                    {video.short_type === 'update' && (
                        <span className="absolute top-2 left-2 bg-dark-panel border border-dark-border text-zinc-300 text-[9px] font-mono uppercase tracking-wider px-2 py-1">Update</span>
                    )}
                    {video.short_type === 'intro' && (
                        <span className="absolute top-2 left-2 bg-dark-panel border border-dark-border text-zinc-300 text-[9px] font-mono uppercase tracking-wider px-2 py-1">Prévia</span>
                    )}
                    {video.short_type === 'flash' && (
                        <span className="absolute top-2 left-2 bg-dark-panel border border-dark-border text-zinc-300 text-[9px] font-mono uppercase tracking-wider px-2 py-1">Flash</span>
                    )}
                    
                    <h3 className="absolute bottom-2 left-2 right-2 text-[10px] font-mono uppercase tracking-wider text-zinc-300 line-clamp-2 group-hover:text-white transition-colors">
                        {video.title}
                    </h3>
                </div>
            </div>
        );
    }

    // Caso contrário, renderizamos o card padrão que você já tinha
    return (
        <div onClick={() => onNavigate(`/video/${video.id}`)} className="flex-shrink-0 w-64 group cursor-pointer">
            <div className="relative w-full aspect-video overflow-hidden border border-dark-border bg-dark-panel">
                <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-80"
                />
            </div>
            <h3 className="mt-2 text-[11px] font-mono uppercase tracking-wider text-zinc-400 line-clamp-2 leading-snug group-hover:text-brand-primary transition-colors">
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
                <h2 className="font-anton text-white text-2xl hover:text-brand-primary transition-colors inline-block">{title}</h2>
            </div>
            
            <button 
                onClick={() => scroll('left')} 
                className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 z-10 p-2 bg-dark-panel/80 border border-dark-border text-white opacity-0 group-hover/row:opacity-100 transition-all hover:bg-brand-primary hover:text-dark-pure disabled:opacity-0"
            >
                &lt;
            </button>
            <button 
                onClick={() => scroll('right')} 
                className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 z-10 p-2 bg-dark-panel/80 border border-dark-border text-white opacity-0 group-hover/row:opacity-100 transition-all hover:bg-brand-primary hover:text-dark-pure"
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