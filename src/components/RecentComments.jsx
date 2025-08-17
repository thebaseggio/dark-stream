// src/pages/RecentComments.jsx

import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Link } from 'react-router-dom';

// Componente para um item individual da lista de comentários
function CommentItem({ comment }) {
  return (
    <li className="py-4 px-2 hover:bg-zinc-800/50 rounded-md">
      <div className="flex items-start space-x-3">
        <img className="h-8 w-8 rounded-full object-cover" src={comment.user_id.creatorAvatar || `https://ui-avatars.com/api/?name=${comment.user_id.username?.charAt(0)}`} alt={comment.user_id.username} />
        <div className="flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{comment.user_id.username}</h3>
            <p className="text-xs text-zinc-500">{new Date(comment.created_at).toLocaleDateString()}</p>
          </div>
          <p className="text-sm text-zinc-300">{comment.content}</p>
          <p className="text-xs text-zinc-400 pt-1">
            em <Link to={`/video/${comment.video_id.id}`} className="font-semibold hover:underline hover:text-[#f1c40f]">{comment.video_id.title}</Link>
          </p>
        </div>
      </div>
    </li>
  );
}


export default function RecentComments({ userId }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      if (!userId) return;
      setIsLoading(true);

      // 1. Primeiro, pegamos os IDs de todos os vídeos que pertencem ao Parceiro logado.
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('id')
        .eq('creator_id', userId);

      if (videosError) {
        console.error("Erro ao buscar vídeos do parceiro:", videosError);
        setIsLoading(false);
        return;
      }

      const videoIds = videosData.map(video => video.id);

      // 2. Agora, buscamos os 5 comentários mais recentes ONDE o 'video_id' seja um dos IDs que encontramos.
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select(`
          *,
          video_id ( id, title ),
          user_id ( username, creatorAvatar )
        `)
        .in('video_id', videoIds)
        .order('created_at', { ascending: false })
        .limit(5);

      if (commentsError) {
        console.error("Erro ao buscar comentários:", commentsError);
      } else {
        setComments(commentsData);
      }
      setIsLoading(false);
    };

    fetchComments();
  }, [userId]);

  return (
    <div className="bg-zinc-900 p-4 sm:p-6 rounded-lg">
      <h3 className="text-xl font-bold mb-4 text-white">Comentários Recentes</h3>
      {isLoading ? (
        <p className="text-zinc-400">Carregando comentários...</p>
      ) : comments.length > 0 ? (
        <ul className="divide-y divide-zinc-800">
          {comments.map(comment => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </ul>
      ) : (
        <p className="text-zinc-400 text-center py-4">Ainda não há comentários nos seus vídeos. Continue criando!</p>
      )}
    </div>
  );
}