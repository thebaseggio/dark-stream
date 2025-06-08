import { Link } from 'react-router-dom';

function MyVideos({ videos, onEdit, onDelete }) {
  return (
    <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 py-10 max-w-7xl mx-auto">
      {videos.length === 0 ? (
        <p className="text-white text-center col-span-full">Nenhum vídeo encontrado.</p>
      ) : (
        videos.map((video) => (
          <div
            key={video.id}
            className="bg-zinc-800 border border-yellow-600 rounded-lg overflow-hidden shadow-lg flex flex-col hover:scale-105 transition-transform duration-200"
          >
            <img
              src={video.thumbnail}
              alt={video.title}
              className="object-cover w-full h-40"
            />
            <div className="p-4 flex flex-col flex-grow justify-between">
              <h2 className="text-lg font-semibold text-white mb-2">
                {video.title}
              </h2>
              <p className="text-sm text-gray-400 mb-1">⏱ {video.duration}</p>
              <p className="text-sm text-gray-500 mb-3">👁️ {video.views || 0} visualizações</p>
              <div className="flex justify-center gap-3 mt-auto">
                <Link to={`/video/${video.id}`}>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded shadow">
                    ▶ Assistir
                  </button>
                </Link>
                <button
                  onClick={() => onEdit(video)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-1 px-4 rounded shadow"
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => onDelete(video.id)}
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-4 rounded shadow"
                >
                  🗑 Excluir
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </main>
  );
}

export default MyVideos;
