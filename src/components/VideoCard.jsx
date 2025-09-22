import React from 'react';
import { useNavigate } from 'react-router-dom';

// Ícone de verificado
const VerifiedIcon = (props) => ( <svg {...props} viewBox="0 0 24 24" fill="currentColor"><path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M10.09,16.5L6.5,12.91L7.91,11.5L10.09,13.67L16.08,7.68L17.5,9.09L10.09,16.5Z" /></svg> );

export default function VideoCard({ video, onNavigate, orientation = 'vertical' }) {
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
        // Implementação da função timeAgo (sem alterações)
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

    if (orientation === 'horizontal') {
        return (
            <div className="flex items-center gap-3 cursor-pointer bg-zinc-800 hover:bg-zinc-700 rounded-lg p-2 transition-colors" onClick={handleCardClick}>
                <img src={video.thumbnail_url} alt={video.title} className="w-32 h-20 object-cover rounded-md flex-shrink-0"/>
                <div className="flex flex-col flex-grow">
                    <h3 className="text-white text-sm font-semibold line-clamp-2 leading-tight">{video.title}</h3>
                    <div className="flex items-center text-gray-400 text-xs mt-1">
                        <span>{video.creator_username}</span>
                        {video.creator_role === 'partner' && <VerifiedIcon className="ml-1 w-3 h-3 text-blue-500" title="Parceiro Verificado"/>}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full cursor-pointer" onClick={handleCardClick}>
            <img src={video.thumbnail_url} alt={video.title} className="w-full h-40 object-cover rounded-lg"/>
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