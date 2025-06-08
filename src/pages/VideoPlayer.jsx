import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function VideoPlayer({ videos }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);

  useEffect(() => {
    let currentVideos = videos;

    // Se os vídeos não foram passados via props, tenta buscar do localStorage
    if (!currentVideos || currentVideos.length === 0) {
      const stored = localStorage.getItem('darkstream_videos');
      if (stored) {
        currentVideos = JSON.parse(stored);
      }
    }

    const found = currentVideos?.find((v) => v.id === parseInt(id));
    if (!found) {
      navigate('/');
    } else {
      setVideo(found);
    }
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
          src={video.videoUrl}
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
