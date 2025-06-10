import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

function VideoPlayer({ videos }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);

  useEffect(() => {
    const fetchVideo = async () => {
      let currentVideos = videos;

      if (!currentVideos || currentVideos.length === 0) {
        const { data, error } = await supabase
          .from('videos')
          .select('id, title, description, url, thumbnail, duration, publishedat, category, views')
          .eq('id', id)
          .single();
        if (error || !data) {
          navigate('/');
          return;
        }
        setVideo(data);
        return;
      }

      const found = currentVideos.find((v) => v.id === parseInt(id));
      if (!found) {
        navigate('/');
      } else {
        setVideo(found);
      }
    };

    fetchVideo();
  }, [id, videos, navigate]);

  if (!video) {
    return <div className="text-center mt-10 text-white">Carregando vídeo...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">{video.title}</h2>

      <div className="w-full max-w-4xl aspect-video rounded overflow-hidden mb-6">
        <iframe
          className="w-full h-full"
          src={video.url}
          title={video.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      <p className="text-gray-400 mb-2">⏱ {video.duration}</p>
      <p className="text-gray-500">👁️ {video.views || 0} visualizações</p>
    </div>
  );
}

export default VideoPlayer;
