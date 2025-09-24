import React from 'react';
import { useNavigate } from 'react-router-dom';

// Ícone de verificado
const VerifiedIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10.09,16.5L6.5,12.91L7.91,11.5L10.09,13.67L16.08,7.68L17.5,9.09L10.09,16.5Z" /></svg> );

export default function VideoCard({ video, onNavigate, orientation = 'vertical', variant = 'default' }) {
    const navigate = useNavigate();

    const handleCardClick = () => {
        if (onNavigate) {
            onNavigate(`/watch/${video.id}`);
        } else {
            navigate(`/watch/${video.id}`);
        }
    };

    const formattedViews = (views) => {
        if (!views) return "0 visualizações";
        if (views >= 1000000) return `${(views / 1000000).toFixed(1).replace(/\.0$/, '')}M visualizações`;
        if (views >= 1000) return `${(views / 1000).toFixed(1).replace(/\.0$/, '')}K visualizações`;
        return `${views} visualizações`;
    };

    const timeAgo = (timestamp) => {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInSeconds = Math.floor((now - past) / 1000);

        const minutes = Math.floor(diffInSeconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const months = Math.floor(days / 30);
        const years = Math.floor(months / 12);

        if (years > 0) return `${years} ano${years > 1 ? 's' : ''} atrás`;
        if (months > 0) return `${months} mês${months > 1 ? 'es' : ''} atrás`;
        if (days > 0) return `${days} dia${days > 1 ? 's' : ''} atrás`;
        if (hours > 0) return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
        if (minutes > 0) return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
        return 'agora mesmo';
    };

// Substitua todo o bloco 'if (orientation === 'horizontal')' por este:

if (orientation === 'horizontal') {
    return (
        <div 
            className="flex gap-4 cursor-pointer group" 
            onClick={handleCardClick}
        >
            {/* Thumbnail */}
            <div className="w-40 flex-shrink-0">
                <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className="w-full aspect-video object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                />
            </div>
            {/* Informações */}
            <div className="flex flex-col justify-center">
                <h3 className="text-white text-md font-semibold line-clamp-2 leading-tight group-hover:text-[#f1c40f]">
                    {video.title}
                </h3>
                <div className="flex items-center text-gray-400 text-sm mt-2 gap-2">
                    {/* Usamos 'video.creator' pois foi assim que nomeamos no select da aba Histórico */}
                    <img 
                        src={video.creator?.creatorAvatar || `https://ui-avatars.com/api/?name=${video.creator?.username.charAt(0)}`}
                        alt={video.creator?.username}
                        className="w-6 h-6 rounded-full object-cover"
                    />
                    <span>{video.creator?.username}</span>
                </div>
            </div>
        </div>
    );
}

        if (variant === 'short') {
        return (
            <div className="w-44 flex-shrink-0 cursor-pointer group" onClick={handleCardClick}>
                <div className="relative">
                    <img src={video.thumbnail_url} alt={video.title} className="w-full aspect-[9/16] object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="text-white text-sm font-semibold line-clamp-2 leading-tight">{video.title}</h3>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full cursor-pointer group" onClick={handleCardClick}>
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-40 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"/>
            <div className="flex items-start gap-3 mt-3">
                <img src={video.creator_avatar_url || `https://ui-avatars.com/api/?name=${video.creator_username.charAt(0)}&background=27272a&color=f1c40f&bold=true`} alt={video.creator_username} className="w-8 h-8 rounded-full object-cover"/>
                <div className="flex-grow">
                    <h3 className="text-white text-md font-semibold line-clamp-2 leading-tight">{video.title}</h3>
                    <div className="flex items-center text-gray-400 text-sm mt-1">
                        <span>{video.creator_username}</span>
                        {video.creator_role === 'partner' && <VerifiedIcon className="ml-1 w-3 h-3 text-blue-500" title="Parceiro Verificado"/>}
                    </div>
                    <p className="text-gray-500 text-xs">{formattedViews(video.views)} • {timeAgo(video.created_at)}</p>
                </div>
            </div>
        </div>
    );
}