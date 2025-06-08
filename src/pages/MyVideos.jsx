import { Link } from 'react-router-dom';

export default function MyVideos({ videos }) {
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🎬 Meus Vídeos</h1>
      <Link to="/">
        <button className="bg-gray-700 text-white py-1 px-3 mb-4 rounded hover:bg-gray-800">
          ← Voltar para a home
        </button>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.length === 0 ? (
          <p>Você ainda não publicou nenhum vídeo.</p>
        ) : (
          videos.map((video) => (
            <div key={video.id} className="video-card">
              <img src={video.thumbnail} alt={video.title} />
              <div className="video-info">
                <h2>{video.title}</h2>
                <p className="duration">⏱ {video.duration}</p>
                <Link to={`/video/${video.id}`}>
                  <button className="watch-button">Assistir</button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
