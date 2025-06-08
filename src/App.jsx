import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import VideoPlayer from './pages/VideoPlayer';
import CreatorPanel from './pages/CreatorPanel';
import MyVideos from './pages/MyVideos';

function AppContent() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [videos, setVideos] = useState([]);
  const [videoToEdit, setVideoToEdit] = useState(null);

  useEffect(() => {
    const storedVideos = localStorage.getItem('darkstream_videos');
    if (storedVideos) {
      setVideos(JSON.parse(storedVideos));
    }
  }, []);

  const handleCategoryFilter = (category) => {
    setSelectedCategory((prev) => (prev === category ? '' : category));
  };

  const saveVideosToLocalStorage = (data) => {
    localStorage.setItem('darkstream_videos', JSON.stringify(data));
  };

  const handleAddVideo = (newVideo) => {
    if (videoToEdit) {
      const updated = videos.map((v) =>
        v.id === videoToEdit.id ? { ...v, ...newVideo } : v
      );
      setVideos(updated);
      saveVideosToLocalStorage(updated);
      setVideoToEdit(null);
    } else {
      const updated = [
        ...videos,
        { ...newVideo, id: videos.length + 1, duration: "00:00", views: 0 },
      ];
      setVideos(updated);
      saveVideosToLocalStorage(updated);
    }
  };

  const handleDeleteVideo = (id) => {
    const filtered = videos.filter((v) => v.id !== id);
    setVideos(filtered);
    saveVideosToLocalStorage(filtered);
  };

  const handleEditVideo = (video) => {
    setVideoToEdit(video);
    navigate('/painel');
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <nav className="bg-zinc-900 border-b border-zinc-700 p-4 flex flex-col sm:flex-row justify-between items-center">
        <Link to="/">
          <h1 className="text-purple-500 text-2xl font-bold cursor-pointer hover:text-purple-400">Dark Stream</h1>
        </Link>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Link to="/"><button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded">Início</button></Link>
          <Link to="/painel"><button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded">Painel de Criador</button></Link>
          <Link to="/meus-videos"><button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-1.5 rounded">Meus Vídeos</button></Link>
        </div>
      </nav>

      <div className="w-full flex flex-wrap justify-center items-center gap-2 my-6 px-4 text-center">
        {["investigativo", "casos-famosos", "desaparecimentos", "arquivos-policiais", "podcasts", "nao-solucionados"].map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryFilter(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              selectedCategory === cat
                ? "bg-purple-700 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {cat
              .replace("nao-solucionados", "⚖️ Não Solucionados")
              .replace("investigativo", "🔍 Investigativo")
              .replace("casos-famosos", "👥 Casos Famosos")
              .replace("desaparecimentos", "🕵️ Desaparecimentos")
              .replace("arquivos-policiais", "📺 Arquivos Policiais")
              .replace("podcasts", "🎧 Podcasts")}
          </button>
        ))}
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <main className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4 pb-10 max-w-7xl mx-auto">
              {videos
                .filter((video) => !selectedCategory || video.category === selectedCategory)
                .map((video) => (
                  <Link
                    to={`/video/${video.id}`}
                    key={video.id}
                    className="transform hover:scale-105 transition-transform duration-200 group perspective-[1000px]"
                  >
                    <div className="relative h-[350px] [transform-style:preserve-3d] transition-transform duration-500 group-hover:[transform:rotateY(180deg)]">
                      <div className="absolute inset-0 bg-zinc-800 border border-yellow-500 rounded-lg p-4 flex flex-col justify-between cursor-pointer [backface-visibility:hidden]">
                        <img src={video.thumbnail} alt={video.title} className="rounded-md object-cover w-full h-40" />
                        <div className="mt-3">
                          <h2 className="text-white text-base font-semibold text-left line-clamp-2 mb-1">{video.title}</h2>
                          <p className="text-sm text-gray-500 text-center">👁️ {video.views || 0} visualizações</p>
                        </div>
                        <div className="mt-3 flex justify-center gap-2">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleEditVideo(video);
                            }}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-1 px-3 rounded shadow"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteVideo(video.id);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded shadow"
                          >
                            🗑 Excluir
                          </button>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-zinc-800 border border-yellow-500 rounded-lg p-4 flex flex-col justify-center items-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                        <p className="text-white text-lg">⏱ {video.duration}</p>
                      </div>
                    </div>
                  </Link>
                ))}
            </main>
          }
        />
        <Route path="/painel" element={<CreatorPanel onAddVideo={handleAddVideo} videoToEdit={videoToEdit} />} />
        <Route path="/video/:id" element={<VideoPlayer videos={videos} />} />
        <Route path="/meus-videos" element={<MyVideos videos={videos} />} />
      </Routes>

      <footer className="bg-zinc-900 border-t border-zinc-700 text-center py-4 text-sm text-gray-400 mt-10">
        <p>© 2025 Dark Stream. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
