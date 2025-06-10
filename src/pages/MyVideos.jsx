import { Link } from 'react-router-dom';

export default function MyVideos({ videos, onEdit, onDelete }) {
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
            <Link
              to={`/video/${video.id}`}
              key={video.id}
              className="transform hover:scale-105 transition-transform duration-200 group perspective-[1000px]"
            >
              <div className="relative h-[350px] [transform-style:preserve-3d] transition-transform duration-500 group-hover:[transform:rotateY(180deg)]">
                <div className="absolute inset-0 bg-black border border-yellow-500 rounded-lg p-4 flex flex-col justify-between cursor-pointer [backface-visibility:hidden]">
                  <img src={video.thumbnail} alt={video.title} className="rounded-md object-cover w-full h-40" />
                  <div className="mt-3">
                    <h2 className="text-white text-base font-semibold text-left line-clamp-2 mb-1">{video.title}</h2>
                  </div>
                </div>
                <div className="absolute inset-0 bg-black border border-yellow-500 rounded-lg p-4 flex flex-col justify-between items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-300">📅 {video.publishedAt}</p>
                    <p className="text-sm text-gray-300">⏱ {video.duration}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onEdit(video);
                      }}
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-1 px-3 rounded"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        onDelete(video.id);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded"
                    >
                      🗑 Excluir
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
